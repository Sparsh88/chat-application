import { Server, Socket } from 'socket.io';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Keep track of active connections: Map<userId, Set<socketId>>
const userSockets = new Map<string, Set<string>>();

// Keep track of active calls: Map<callId, { roomMembers: Set<string>, hostId: string }>
const activeCallRooms = new Map<string, { members: Set<string>; type: 'VIDEO' | 'VOICE' }>();

export function initSocketIO(io: Server) {
  io.on('connection', (socket: Socket) => {
    let currentUserId: string | null = null;

    // Register User identity with their socket connection
    socket.on('register_user', async ({ userId }: { userId: string }) => {
      currentUserId = userId;
      
      if (!userSockets.has(userId)) {
        userSockets.set(userId, new Set());
      }
      userSockets.get(userId)!.add(socket.id);

      // Set DB presence status to online
      await prisma.user.update({
        where: { id: userId },
        data: { onlinePresence: 'online' }
      });

      // Broadcast presence update to friends/groups
      io.emit('user_presence_change', { userId, presence: 'online' });
    });

    // Handle typing events
    socket.on('typing', ({ userId, recipientId, groupId, isTyping }: any) => {
      if (groupId) {
        // Group typing
        socket.to(groupId).emit('user_typing', { userId, groupId, isTyping });
      } else if (recipientId) {
        // Direct DM typing
        const targetSockets = userSockets.get(recipientId);
        if (targetSockets) {
          targetSockets.forEach(sid => {
            io.to(sid).emit('user_typing', { userId, isTyping });
          });
        }
      }
    });

    // Real-time Chat message sender
    socket.on('send_message', async (msgData: {
      content: string;
      senderId: string;
      receiverId?: string;
      groupId?: string;
      isE2EE?: boolean;
      encryptionIv?: string;
      fileUrl?: string;
      fileName?: string;
      fileType?: string;
      isDisappearing?: boolean;
      selfDestructDuration?: number;
    }) => {
      try {
        // Save to DB
        const savedMessage = await prisma.message.create({
          data: {
            content: msgData.content,
            senderId: msgData.senderId,
            receiverId: msgData.receiverId || null,
            groupId: msgData.groupId || null,
            isE2EE: msgData.isE2EE || false,
            encryptionIv: msgData.encryptionIv || null,
            fileUrl: msgData.fileUrl || null,
            fileName: msgData.fileName || null,
            fileType: msgData.fileType || null,
            isDisappearing: msgData.isDisappearing || false,
            selfDestructDuration: msgData.selfDestructDuration || null
          }
        });

        // Broadcast to receiver socket(s) if DM
        if (msgData.receiverId) {
          const recipientSids = userSockets.get(msgData.receiverId);
          if (recipientSids) {
            recipientSids.forEach(sid => {
              io.to(sid).emit('new_message', savedMessage);
            });
          }
          // Also echo back to sender's other sockets (multi-device)
          const senderSids = userSockets.get(msgData.senderId);
          if (senderSids) {
            senderSids.forEach(sid => {
              if (sid !== socket.id) {
                io.to(sid).emit('new_message', savedMessage);
              }
            });
          }
        } 
        
        // Broadcast to group room if group
        if (msgData.groupId) {
          io.to(msgData.groupId).emit('new_message', savedMessage);
        }
      } catch (err: any) {
        socket.emit('error', { message: 'Failed to send message: ' + err.message });
      }
    });

    // Joining channel/server rooms
    socket.on('join_group', ({ groupId }: { groupId: string }) => {
      socket.join(groupId);
    });

    // Leaving channel/server rooms
    socket.on('leave_group', ({ groupId }: { groupId: string }) => {
      socket.leave(groupId);
    });

    // --- WebRTC Signalling and Call Controls ---
    
    // Request a call connection (Initiation)
    socket.on('initiate_call', ({ targetUserId, callerId, type, roomId }: { targetUserId: string; callerId: string; type: 'VIDEO' | 'VOICE'; roomId: string }) => {
      const recipientSids = userSockets.get(targetUserId);
      if (recipientSids) {
        recipientSids.forEach(sid => {
          io.to(sid).emit('incoming_call', { callerId, type, roomId });
        });
      }
      activeCallRooms.set(roomId, { members: new Set([callerId]), type });
    });

    // Accept an incoming call
    socket.on('accept_call', ({ roomId, userId }: { roomId: string; userId: string }) => {
      const call = activeCallRooms.get(roomId);
      if (call) {
        call.members.add(userId);
        // Inform other participants
        socket.join(roomId);
        socket.to(roomId).emit('call_accepted', { userId, roomId });
      }
    });

    // Reject a call
    socket.on('reject_call', ({ roomId, callerId }: { roomId: string; callerId: string }) => {
      const callerSids = userSockets.get(callerId);
      if (callerSids) {
        callerSids.forEach(sid => {
          io.to(sid).emit('call_rejected', { roomId });
        });
      }
      activeCallRooms.delete(roomId);
    });

    // Signaling channel for SDP & ICE exchanges
    socket.on('webrtc_signal', ({ roomId, signalData, senderId }: { roomId: string; signalData: any; senderId: string }) => {
      // Forward the signaling data to other members in the call room
      socket.to(roomId).emit('webrtc_signal_forward', { signalData, senderId });
    });

    // Triggered on Mute, Camera toggle, Raise Hand, Blur filter toggle
    socket.on('call_action', ({ roomId, userId, action, state }: { roomId: string; userId: string; action: string; state: boolean }) => {
      io.to(roomId).emit('participant_action', { userId, action, state });
    });

    // Terminating the WebRTC call session
    socket.on('leave_call', async ({ roomId, userId, duration }: { roomId: string; userId: string; duration?: number }) => {
      const call = activeCallRooms.get(roomId);
      if (call) {
        call.members.delete(userId);
        socket.leave(roomId);
        io.to(roomId).emit('participant_left', { userId });

        if (call.members.size <= 1) {
          // Log call history to database on call end
          const remainingMember = Array.from(call.members)[0];
          if (remainingMember && duration) {
            try {
              await prisma.callHistory.create({
                data: {
                  callerId: remainingMember,
                  receiverId: userId,
                  type: call.type,
                  duration: duration
                }
              });
            } catch (e) {
              // Ignore prisma logs in mock connections
            }
          }
          activeCallRooms.delete(roomId);
          io.to(roomId).emit('call_ended', { roomId });
        }
      }
    });

    // --- Message Reactions & Polls ---
    
    // Create Real-time message reactions
    socket.on('add_reaction', async ({ messageId, emoji, userId }: { messageId: string; emoji: string; userId: string }) => {
      try {
        const message = await prisma.message.findUnique({ where: { id: messageId } });
        if (message) {
          let reactionsObj: Record<string, string[]> = {};
          if (message.reactions) {
            reactionsObj = JSON.parse(message.reactions);
          }
          
          if (!reactionsObj[emoji]) {
            reactionsObj[emoji] = [];
          }
          if (!reactionsObj[emoji].includes(userId)) {
            reactionsObj[emoji].push(userId);
          }

          const updatedMessage = await prisma.message.update({
            where: { id: messageId },
            data: { reactions: JSON.stringify(reactionsObj) }
          });

          // Notify targets
          if (updatedMessage.groupId) {
            io.to(updatedMessage.groupId).emit('reaction_updated', { messageId, reactions: reactionsObj });
          } else if (updatedMessage.receiverId) {
            const recipientSids = userSockets.get(updatedMessage.receiverId);
            if (recipientSids) {
              recipientSids.forEach(sid => io.to(sid).emit('reaction_updated', { messageId, reactions: reactionsObj }));
            }
            const senderSids = userSockets.get(updatedMessage.senderId);
            if (senderSids) {
              senderSids.forEach(sid => io.to(sid).emit('reaction_updated', { messageId, reactions: reactionsObj }));
            }
          }
        }
      } catch (err) {}
    });

    // Dynamic presence status switcher
    socket.on('presence_override', async ({ userId, presence }: { userId: string; presence: string }) => {
      await prisma.user.update({
        where: { id: userId },
        data: { onlinePresence: presence }
      });
      io.emit('user_presence_change', { userId, presence });
    });

    // Cleanup socket registers on disconnection
    socket.on('disconnect', async () => {
      if (currentUserId && userSockets.has(currentUserId)) {
        const sids = userSockets.get(currentUserId)!;
        sids.delete(socket.id);
        if (sids.size === 0) {
          userSockets.delete(currentUserId);
          
          // Update DB presence status to offline
          try {
            await prisma.user.update({
              where: { id: currentUserId },
              data: { onlinePresence: 'offline' }
            });
            io.emit('user_presence_change', { userId: currentUserId, presence: 'offline' });
          } catch (e) {}
        }
      }
    });
  });
}
