import React, { createContext, useContext, useState, useEffect } from 'react';
import { CallState, User } from '../types';
import { webrtcService } from '../services/webrtcService';
import { useSocket } from './SocketContext';
import { useAuth } from './AuthContext';

interface CallContextType {
  callState: CallState;
  startCall: (callType: 'voice' | 'video', recipientUser?: User) => Promise<void>;
  endCall: () => void;
  toggleMute: () => void;
  toggleCamera: () => void;
  toggleScreenShare: () => Promise<void>;
  toggleBackgroundBlur: (canvasElem?: HTMLCanvasElement) => void;
  toggleRaiseHand: () => void;
  toggleCallRecording: () => void;
  incomingCall: { caller: User; isVideo: boolean; offer: any; callerSocketId: string } | null;
  acceptCall: () => Promise<void>;
  rejectCall: () => void;
}

const INITIAL_CALL_STATE: CallState = {
  isActive: false,
  isInProgress: false,
  callType: 'video',
  isMuted: false,
  isCameraOff: false,
  isScreenSharing: false,
  isBackgroundBlurred: false,
  isHandRaised: false,
  isRecording: false,
  durationSeconds: 0,
  localStream: null,
  remoteStream: null
};

const CallContext = createContext<CallContextType | undefined>(undefined);

export const CallProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [callState, setCallState] = useState<CallState>(INITIAL_CALL_STATE);
  const [incomingCall, setIncomingCall] = useState<{ caller: User; isVideo: boolean; offer: any; callerSocketId: string } | null>(null);
  const { socket } = useSocket();
  const { currentUser } = useAuth();

  // Call timer interval
  useEffect(() => {
    let timer: any;
    if (callState.isInProgress) {
      timer = setInterval(() => {
        setCallState(prev => ({ ...prev, durationSeconds: prev.durationSeconds + 1 }));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [callState.isInProgress]);

  // Socket signaling listener
  useEffect(() => {
    if (!socket) return;

    socket.on('incoming_call', (data) => {
      setIncomingCall(data);
    });

    socket.on('call_accepted', async () => {
      setCallState(prev => ({ ...prev, isInProgress: true }));
    });

    socket.on('call_ended', () => {
      endCall();
    });

    socket.on('hand_raised', (data) => {
      if (data.username !== currentUser.name) {
        // Notification for raised hand
      }
    });

    return () => {
      socket.off('incoming_call');
      socket.off('call_accepted');
      socket.off('call_ended');
      socket.off('hand_raised');
    };
  }, [socket, currentUser.name]);

  const startCall = async (callType: 'voice' | 'video', recipientUser?: User) => {
    try {
      const stream = await webrtcService.getLocalStream(callType === 'video', true);
      setCallState({
        isActive: true,
        isInProgress: true,
        callType,
        recipientUser,
        isMuted: false,
        isCameraOff: false,
        isScreenSharing: false,
        isBackgroundBlurred: false,
        isHandRaised: false,
        isRecording: false,
        durationSeconds: 0,
        localStream: stream,
        remoteStream: stream // Simulated peer echo stream
      });

      if (socket && recipientUser) {
        socket.emit('call_initiate', {
          targetUserId: recipientUser.id,
          caller: currentUser,
          offer: { sdp: 'mock-sdp-offer' },
          isVideo: callType === 'video'
        });
      }
    } catch (err) {
      console.error('Failed to start WebRTC call:', err);
    }
  };

  const acceptCall = async () => {
    if (!incomingCall) return;
    try {
      const stream = await webrtcService.getLocalStream(incomingCall.isVideo, true);
      setCallState({
        isActive: true,
        isInProgress: true,
        callType: incomingCall.isVideo ? 'video' : 'voice',
        recipientUser: incomingCall.caller,
        isMuted: false,
        isCameraOff: false,
        isScreenSharing: false,
        isBackgroundBlurred: false,
        isHandRaised: false,
        isRecording: false,
        durationSeconds: 0,
        localStream: stream,
        remoteStream: stream
      });

      if (socket) {
        socket.emit('call_answer', { callerSocketId: incomingCall.callerSocketId, answer: { sdp: 'mock-sdp-answer' } });
      }
      setIncomingCall(null);
    } catch (err) {
      console.error('Failed to accept call:', err);
    }
  };

  const rejectCall = () => {
    if (socket && incomingCall) {
      socket.emit('end_call', { targetSocketId: incomingCall.callerSocketId });
    }
    setIncomingCall(null);
  };

  const endCall = () => {
    if (callState.isRecording && callState.localStream) {
      webrtcService.stopRecordingAndDownload(`pulse-nexus-call-${Date.now()}.webm`);
    }
    webrtcService.stopAllStreams();
    setCallState(INITIAL_CALL_STATE);
  };

  const toggleMute = () => {
    setCallState(prev => {
      const isMuted = !prev.isMuted;
      if (prev.localStream) {
        prev.localStream.getAudioTracks().forEach(track => track.enabled = !isMuted);
      }
      return { ...prev, isMuted };
    });
  };

  const toggleCamera = () => {
    setCallState(prev => {
      const isCameraOff = !prev.isCameraOff;
      if (prev.localStream) {
        prev.localStream.getVideoTracks().forEach(track => track.enabled = !isCameraOff);
      }
      return { ...prev, isCameraOff };
    });
  };

  const toggleScreenShare = async () => {
    if (callState.isScreenSharing) {
      // Revert to camera stream
      const stream = await webrtcService.getLocalStream(callState.callType === 'video', true);
      setCallState(prev => ({ ...prev, isScreenSharing: false, localStream: stream }));
    } else {
      try {
        const screenStream = await webrtcService.getDisplayStream();
        setCallState(prev => ({ ...prev, isScreenSharing: true, localStream: screenStream }));
      } catch (e) {
        console.warn('Screen share cancelled');
      }
    }
  };

  const toggleBackgroundBlur = (canvasElem?: HTMLCanvasElement) => {
    setCallState(prev => {
      const isBackgroundBlurred = !prev.isBackgroundBlurred;
      if (isBackgroundBlurred && prev.localStream && canvasElem) {
        const videoTrack = prev.localStream.getVideoTracks()[0];
        if (videoTrack) {
          const blurredTrack = webrtcService.applyBackgroundBlur(videoTrack, canvasElem);
          const newStream = new MediaStream([blurredTrack, ...prev.localStream.getAudioTracks()]);
          return { ...prev, isBackgroundBlurred, localStream: newStream };
        }
      }
      return { ...prev, isBackgroundBlurred };
    });
  };

  const toggleRaiseHand = () => {
    setCallState(prev => {
      const isHandRaised = !prev.isHandRaised;
      if (socket) {
        socket.emit('raise_hand', { roomId: 'call-room', username: currentUser.name, isRaised: isHandRaised });
      }
      return { ...prev, isHandRaised };
    });
  };

  const toggleCallRecording = () => {
    setCallState(prev => {
      const isRecording = !prev.isRecording;
      if (isRecording && prev.localStream) {
        webrtcService.startRecording(prev.localStream);
      } else if (!isRecording && prev.localStream) {
        webrtcService.stopRecordingAndDownload(`pulse-nexus-call-${Date.now()}.webm`);
      }
      return { ...prev, isRecording };
    });
  };

  return (
    <CallContext.Provider value={{
      callState,
      startCall,
      endCall,
      toggleMute,
      toggleCamera,
      toggleScreenShare,
      toggleBackgroundBlur,
      toggleRaiseHand,
      toggleCallRecording,
      incomingCall,
      acceptCall,
      rejectCall
    }}>
      {children}
    </CallContext.Provider>
  );
};

export const useCall = () => {
  const context = useContext(CallContext);
  if (!context) throw new Error('useCall must be used within CallProvider');
  return context;
};
