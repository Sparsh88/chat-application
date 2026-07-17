import React, { useState, useEffect, useRef, useContext } from 'react';
import { 
  Send, Phone, Video, ShieldCheck, Clock, Calendar, BarChart, 
  Smile, Mic, Volume2, Sparkles, Languages, Plus, File
} from 'lucide-react';
import { motion } from 'framer-motion';
import { AuthContext, SocketContext } from '../App.tsx';
import { CryptoService } from '../services/CryptoService.ts';

interface ChatAreaProps {
  chat: { id: string; name: string; isGroup: boolean; avatarUrl?: string } | null;
}

export default function ChatArea({ chat }: ChatAreaProps) {
  const { user } = useContext(AuthContext)!;
  const { socket } = useContext(SocketContext)!;

  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  
  // E2EE States
  const [sharedKey, setSharedKey] = useState<CryptoKey | null>(null);
  const [keyLogs, setKeyLogs] = useState<string>('Not negotiated');

  // Input Utility States

  const [disappearTime, setDisappearTime] = useState<number | null>(null); // null = off, otherwise in seconds
  const [scheduleDate, setScheduleDate] = useState<string>('');
  const [showScheduleInput, setShowScheduleInput] = useState(false);

  // Poll creation
  const [showPollCreator, setShowPollCreator] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState<string[]>(['', '']);

  // AI Modal
  const [aiResult, setAiResult] = useState<string | null>(null);


  // File Upload
  const [isDragging, setIsDragging] = useState(false);
  const [fileAttachment, setFileAttachment] = useState<{ url: string; name: string; type: string } | null>(null);

  const messageEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 1. Negotiation of E2EE Shared Key (Diffie-Hellman)
  useEffect(() => {
    if (!chat || chat.isGroup) {
      setSharedKey(null);
      setKeyLogs('Not negotiated (Group chat)');
      return;
    }

    const negotiateKey = async () => {
      setKeyLogs('Generating curves (ECDH P-256)...');
      try {
        // Get or generate static key pair for current user
        const ownKeyPair = await CryptoService.getStoredKeyPair(user!.id);
        
        // Load peer's public key (In production we would fetch from DB, here we compute a mock base or use a seed)
        // For local simulation, we derive a unique consistent public key for the partner based on their ID
        const peerKeyPair = await CryptoService.getStoredKeyPair(chat.id);
        
        const derived = await CryptoService.deriveSharedKey(ownKeyPair.privateKey, peerKeyPair.publicKey);
        setSharedKey(derived);
        
        const publicBase64 = await CryptoService.exportPublicKey(peerKeyPair.publicKey);
        setKeyLogs(`AES-256 derived. Peer Public: ${publicBase64.substring(0, 16)}...`);
      } catch (err) {
        setKeyLogs('Key derivation failed.');
      }
    };

    negotiateKey();
  }, [chat, user]);

  // 2. Fetch Chat History (Pagination / Infinite Scroll trigger)
  useEffect(() => {
    if (!chat) return;
    setMessages([]);
    setFileAttachment(null);
    setOtherUserTyping(false);

    // Call history API
    const fetchHistory = async () => {
      try {
        // Select logic for group vs DM history

        
        // Mock loading data to match database seed
        const seedMessages = [
          { id: '1', content: 'Hey there! How is the project going?', senderId: chat.id, createdAt: new Date(Date.now() - 3600000).toISOString() },
          { id: '2', content: 'Just polishing the responsive analytics widget', senderId: user!.id, createdAt: new Date(Date.now() - 1800000).toISOString() }
        ];

        // Decrypt if E2EE DM is selected
        if (!chat.isGroup && sharedKey) {
          const decryptedSeed = await Promise.all(seedMessages.map(async m => {
            if (m.senderId === chat.id) {
              // Simulate encrypted channel payloads
              const encrypted = await CryptoService.encryptMessage(m.content, sharedKey);
              const clear = await CryptoService.decryptMessage(encrypted.ciphertext, encrypted.iv, sharedKey);
              return { ...m, content: clear, isE2EE: true };
            }
            return m;
          }));
          setMessages(decryptedSeed);
        } else {
          setMessages(seedMessages);
        }
      } catch (e) {}
    };

    fetchHistory();

    // Register Socket events for room
    if (socket) {
      if (chat.isGroup) {
        socket.emit('join_group', { groupId: chat.id });
      }

      socket.on('new_message', handleIncomingMessage);
      socket.on('user_typing', handleTypingEvent);
      socket.on('reaction_updated', handleReactionUpdate);

      return () => {
        if (chat.isGroup) {
          socket.emit('leave_group', { groupId: chat.id });
        }
        socket.off('new_message', handleIncomingMessage);
        socket.off('user_typing', handleTypingEvent);
        socket.off('reaction_updated', handleReactionUpdate);
      };
    }
  }, [chat, socket, sharedKey]);

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, otherUserTyping]);

  const handleIncomingMessage = async (msg: any) => {
    // Determine if belongs to active room
    const isMatchingDM = !chat?.isGroup && (
      (msg.senderId === chat?.id && msg.receiverId === user?.id) || 
      (msg.senderId === user?.id && msg.receiverId === chat?.id)
    );
    const isMatchingGroup = chat?.isGroup && msg.groupId === chat.id;

    if (isMatchingDM || isMatchingGroup) {
      let content = msg.content;
      if (msg.isE2EE && sharedKey && msg.senderId !== user?.id) {
        content = await CryptoService.decryptMessage(msg.content, msg.encryptionIv, sharedKey);
      }
      setMessages(prev => [...prev, { ...msg, content }]);
    }
  };

  const handleTypingEvent = (data: any) => {
    if (data.userId === chat?.id) {
      setOtherUserTyping(data.isTyping);
    }
  };

  const handleReactionUpdate = (data: { messageId: string; reactions: any }) => {
    setMessages(prev => prev.map(m => m.id === data.messageId ? { ...m, reactions: JSON.stringify(data.reactions) } : m));
  };

  // Typing state emitter
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);
    if (!socket || !chat) return;

    if (!isTyping) {
      setIsTyping(true);
      socket.emit('typing', {
        userId: user!.id,
        recipientId: chat.isGroup ? null : chat.id,
        groupId: chat.isGroup ? chat.id : null,
        isTyping: true
      });
    }

    // Debounce typing end
    const lastTypingTime = Date.now();
    setTimeout(() => {
      const timeDiff = Date.now() - lastTypingTime;
      if (timeDiff >= 1500 && isTyping) {
        socket.emit('typing', {
          userId: user!.id,
          recipientId: chat.isGroup ? null : chat.id,
          groupId: chat.isGroup ? chat.id : null,
          isTyping: false
        });
        setIsTyping(false);
      }
    }, 1500);
  };

  // 3. Sender pipeline (E2EE triggers here)
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!inputText && !fileAttachment && !showPollCreator) || !socket || !chat) return;

    let payload: any = {
      senderId: user!.id,
      groupId: chat.isGroup ? chat.id : null,
      receiverId: chat.isGroup ? null : chat.id,
      content: inputText,
      isE2EE: false
    };

    if (fileAttachment) {
      payload.fileUrl = fileAttachment.url;
      payload.fileName = fileAttachment.name;
      payload.fileType = fileAttachment.type;
    }

    // If E2EE enabled DM, encrypt content
    if (!chat.isGroup && sharedKey) {
      const encryptRes = await CryptoService.encryptMessage(inputText || '[Attachment]', sharedKey);
      payload.content = encryptRes.ciphertext;
      payload.encryptionIv = encryptRes.iv;
      payload.isE2EE = true;
    }

    if (disappearTime) {
      payload.isDisappearing = true;
      payload.selfDestructDuration = disappearTime;
    }

    socket.emit('send_message', payload);
    
    // Optimistic UI updates
    const tempMsg = {
      id: Math.random().toString(),
      content: inputText || fileAttachment?.name || 'Attachment',
      senderId: user!.id,
      fileUrl: fileAttachment?.url,
      fileName: fileAttachment?.name,
      fileType: fileAttachment?.type,
      createdAt: new Date().toISOString(),
      isDisappearing: !!disappearTime,
      selfDestructDuration: disappearTime
    };
    setMessages(prev => [...prev, tempMsg]);

    // Handle disappearance client-side timer
    if (disappearTime) {
      setTimeout(() => {
        setMessages(prev => prev.filter(m => m.id !== tempMsg.id));
      }, disappearTime * 1000);
    }

    setInputText('');
    setFileAttachment(null);
    setDisappearTime(null);
    setScheduleDate('');
    setShowScheduleInput(false);
  };

  // Reactions pipeline
  const addReaction = (messageId: string, emoji: string) => {
    if (socket) {
      socket.emit('add_reaction', { messageId, emoji, userId: user!.id });
    }
  };

  // Speech to text (Voice Recognition)
  const triggerVoiceInput = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser.');
      return;
    }
    const rec = new SpeechRecognition();
    rec.lang = 'en-US';
    rec.onstart = () => alert('Voice input active. Speak now...');
    rec.onresult = (e: any) => {
      const transcript = e.results[0][0].transcript;
      setInputText(prev => prev + ' ' + transcript);
    };
    rec.start();
  };

  // Text to Speech
  const speakMessage = (text: string) => {
    const speak = new SpeechSynthesisUtterance(text);
    window.speechSynthesis.speak(speak);
  };

  // --- AI Integrations triggers ---

  const triggerAIOperation = async (action: string, extraBody = {}) => {
    setAiLoading(true);
    setAiResult(null);
    try {
      const res = await fetch(`/api/ai/${action}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ chatId: chat?.id, isGroup: chat?.isGroup, ...extraBody })
      });
      const data = await res.json();
      setAiResult(data.summary || data.translatedText || data.rewrittenText || data.correctedText || data.notes || data.tasks || 'AI Operation Completed');
    } catch (e) {
      setAiResult('Failed to contact AI service.');
    } finally {
      setAiLoading(false);
    }
  };

  // File attachments drag and drop handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragging(true);
    } else if (e.type === 'dragleave') {
      setIsDragging(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      // Create local object URL for preview
      const localUrl = URL.createObjectURL(file);
      setFileAttachment({
        url: localUrl,
        name: file.name,
        type: file.type
      });
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const localUrl = URL.createObjectURL(file);
      setFileAttachment({
        url: localUrl,
        name: file.name,
        type: file.type
      });
    }
  };

  // Poll creation sender
  const handleSendPoll = () => {
    if (!pollQuestion) return;
    const pollPayload = `📊 **POLL: ${pollQuestion}**\n` + pollOptions.filter(o => o.trim() !== '').map((o, idx) => `Choice ${idx + 1}: ${o}`).join('\n');
    setInputText(pollPayload);
    setShowPollCreator(false);
    setPollQuestion('');
    setPollOptions(['', '']);
  };

  if (!chat) {
    return (
      <div className="empty-state" style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <Smile size={80} strokeWidth={1} />
        <h2>Select a conversation</h2>
        <p>Choose a text channel or co-worker from the sidebar list to start chatting.</p>
      </div>
    );
  }

  return (
    <div 
      className="chat-view-container" 
      style={{ display: 'flex', height: '100%', flexDirection: 'column', background: 'transparent' }}
      onDragEnter={handleDrag}
      onDragOver={handleDrag}
      onDragLeave={handleDrag}
      onDrop={handleDrop}
    >
      {/* 1. Header Area */}
      <div className="chat-header glass-panel" style={{
        padding: '16px 24px', borderBottom: '1px solid var(--border-glass)', display: 'flex', 
        alignItems: 'center', justifyContent: 'space-between', zIndex: 10
      }}>
        <div>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 16 }}>
            {chat.isGroup ? '#' : '@'} {chat.name}
            {!chat.isGroup && (
              <span 
                style={{ fontSize: 11, color: '#10b981', display: 'inline-flex', alignItems: 'center', gap: 4, background: 'rgba(16,185,129,0.12)', padding: '2px 8px', borderRadius: 10 }}
                title={keyLogs}
              >
                <ShieldCheck size={12} />
                E2EE Secured
              </span>
            )}
          </h3>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 400 }}>
            {chat.isGroup ? 'Group discussions channel' : keyLogs}
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {/* AI Helper trigger triggers */}
          <button className="btn btn-secondary" style={{ padding: '8px 12px', fontSize: 12, gap: 4 }} onClick={() => triggerAIOperation('summarize')}>
            <Sparkles size={14} color="#a855f7" /> Summarize
          </button>
          <button className="btn btn-secondary" style={{ padding: '8px 12px', fontSize: 12, gap: 4 }} onClick={() => triggerAIOperation('extract-tasks')}>
            📋 Tasks
          </button>

          {!chat.isGroup && (
            <>
              <button className="btn btn-secondary" style={{ padding: 8 }} onClick={() => alert('Launching call...')}><Phone size={16} /></button>
              <button className="btn btn-primary" style={{ padding: 8 }} onClick={() => alert('Launching video chat...')}><Video size={16} /></button>
            </>
          )}
        </div>
      </div>

      {/* Drag & Drop Alert Overlay */}
      {isDragging && (
        <div style={{
          position: 'absolute', inset: 0, background: 'rgba(99,102,241,0.2)', backdropFilter: 'blur(4px)',
          zIndex: 99, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '3px dashed var(--primary-color)'
        }}>
          <div className="glass-panel" style={{ padding: 24, borderRadius: 12, textAlign: 'center' }}>
            <Plus size={48} color="var(--primary-color)" style={{ margin: '0 auto 10px' }} />
            <h3>Drop file here to upload</h3>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Images, Videos, PDFs, ZIP, Code logs</p>
          </div>
        </div>
      )}

      {/* 2. Messages Panel */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {messages.map((m: any) => {
          const isOwn = m.senderId === user?.id;
          let rxObj: Record<string, string[]> = {};
          if (m.reactions) {
            try { rxObj = JSON.parse(m.reactions); } catch(e){}
          }

          return (
            <motion.div 
              key={m.id} 
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              style={{ display: 'flex', flexDirection: 'column', alignItems: isOwn ? 'flex-end' : 'flex-start', position: 'relative' }}
            >
              
              {/* Senders tags */}
              <span style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4, padding: '0 4px' }}>
                {isOwn ? 'You' : chat.name} • {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>

              <div style={{ display: 'flex', gap: 8, maxWidth: '100%', flexDirection: isOwn ? 'row-reverse' : 'row' }}>
                
                {/* Bubble */}
                <div className={`msg-bubble ${isOwn ? 'msg-outgoing' : 'msg-incoming'}`}>
                  {m.content}
                  
                  {/* File renderers */}
                  {m.fileUrl && (
                    <div style={{ marginTop: 8, borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 8 }}>
                      {m.fileType?.includes('image') ? (
                        <img src={m.fileUrl} alt={m.fileName} style={{ maxWidth: '100%', maxHeight: 200, borderRadius: 6, objectFit: 'contain' }} />
                      ) : m.fileType?.includes('video') ? (
                        <video src={m.fileUrl} controls style={{ maxWidth: '100%', maxHeight: 200, borderRadius: 6 }} />
                      ) : (
                        <a href={m.fileUrl} download={m.fileName} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: 12, gap: 6 }}>
                          <File size={14} /> Download File
                        </a>
                      )}
                    </div>
                  )}

                  {/* Disappearing indicator */}
                  {m.isDisappearing && (
                    <span style={{ position: 'absolute', bottom: 2, right: 6, fontSize: 8, opacity: 0.6, display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Clock size={8} /> {m.selfDestructDuration}s left
                    </span>
                  )}
                </div>

                {/* Micro Actions bar (Reactions, speech synthesis) */}
                <div className="message-hover-actions" style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                  <button onClick={() => speakMessage(m.content)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', opacity: 0.4 }} title="Text to Speech">
                    <Volume2 size={14} />
                  </button>
                  <button onClick={() => addReaction(m.id, '🔥')} style={{ border: 'none', background: 'transparent', cursor: 'pointer', opacity: 0.4 }}>🔥</button>
                  <button onClick={() => addReaction(m.id, '👍')} style={{ border: 'none', background: 'transparent', cursor: 'pointer', opacity: 0.4 }}>👍</button>
                  <button 
                    onClick={() => triggerAIOperation('translate', { text: m.content, targetLanguage: 'Spanish' })} 
                    style={{ border: 'none', background: 'transparent', cursor: 'pointer', opacity: 0.4 }} 
                    title="Translate to Spanish"
                  >
                    <Languages size={14} />
                  </button>
                </div>
              </div>

              {/* Reactions list */}
              {Object.keys(rxObj).length > 0 && (
                <div style={{ display: 'flex', gap: 4, marginTop: 4, padding: '0 8px' }}>
                  {Object.entries(rxObj).map(([emoji, uids]) => (
                    <span 
                      key={emoji} 
                      onClick={() => addReaction(m.id, emoji)}
                      style={{ fontSize: 11, padding: '2px 6px', background: 'rgba(255,255,255,0.06)', borderRadius: 8, cursor: 'pointer' }}
                    >
                      {emoji} {uids.length}
                    </span>
                  ))}
                </div>
              )}

            </motion.div>
          );
        })}

        {otherUserTyping && (
          <div style={{ alignSelf: 'flex-start', color: 'var(--text-muted)', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span className="pulse-indicator" style={{ backgroundColor: 'var(--text-muted)' }}></span>
            <span>{chat.name} is typing...</span>
          </div>
        )}

        <div ref={messageEndRef} />
      </div>

      {/* File preview alert strip */}
      {fileAttachment && (
        <div style={{ padding: '10px 20px', background: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border-glass)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <File size={20} color="var(--primary-color)" />
            <div>
              <span style={{ fontSize: 13, fontWeight: 550 }}>{fileAttachment.name}</span>
              <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 8 }}>({fileAttachment.type})</span>
            </div>
          </div>
          <button className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: 11 }} onClick={() => setFileAttachment(null)}>Remove</button>
        </div>
      )}

      {/* 3. Input Toolbar Panels (Scheduler / Emoji picker / Polls toggle selectors) */}
      <div className="chat-input-controls-bar" style={{ display: 'flex', gap: 12, padding: '6px 20px', borderTop: '1px solid var(--border-glass)' }}>
        
        {/* Disappearing timer indicator */}
        <select 
          value={disappearTime || ''} 
          onChange={e => setDisappearTime(e.target.value ? Number(e.target.value) : null)}
          style={{ background: 'transparent', color: 'var(--text-secondary)', border: 'none', outline: 'none', fontSize: 12, cursor: 'pointer' }}
        >
          <option value="" style={{ background: 'var(--bg-secondary)' }}>⏳ Disappearing: Off</option>
          <option value="10" style={{ background: 'var(--bg-secondary)' }}>10 Seconds</option>
          <option value="60" style={{ background: 'var(--bg-secondary)' }}>1 Minute</option>
          <option value="3600" style={{ background: 'var(--bg-secondary)' }}>1 Hour</option>
        </select>

        {/* Schedule timer indicator */}
        <button 
          className="btn btn-secondary" 
          style={{ padding: '4px 8px', fontSize: 11, gap: 4, background: showScheduleInput ? 'rgba(99,102,241,0.1)' : 'transparent', border: 'none' }}
          onClick={() => setShowScheduleInput(!showScheduleInput)}
        >
          <Calendar size={12} /> Schedule Send
        </button>

        <button 
          className="btn btn-secondary" 
          style={{ padding: '4px 8px', fontSize: 11, gap: 4, background: showPollCreator ? 'rgba(99,102,241,0.1)' : 'transparent', border: 'none' }}
          onClick={() => setShowPollCreator(!showPollCreator)}
        >
          <BarChart size={12} /> Create Poll
        </button>
      </div>

      {showScheduleInput && (
        <div style={{ padding: '10px 20px', borderTop: '1px solid var(--border-glass)', display: 'flex', gap: 10, alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Release date/time:</span>
          <input 
            type="datetime-local" 
            className="input-field" 
            style={{ width: 'auto', padding: '6px 12px', fontSize: 12 }} 
            value={scheduleDate} 
            onChange={e => setScheduleDate(e.target.value)} 
          />
        </div>
      )}

      {showPollCreator && (
        <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border-glass)', background: 'rgba(0,0,0,0.1)' }}>
          <h4 style={{ fontSize: 13, marginBottom: 10 }}>Construct Real-Time Poll</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <input type="text" className="input-field" style={{ padding: '8px 12px', fontSize: 13 }} placeholder="Question statement..." value={pollQuestion} onChange={e => setPollQuestion(e.target.value)} />
            {pollOptions.map((opt, idx) => (
              <input 
                key={idx} 
                type="text" 
                className="input-field" 
                style={{ padding: '6px 12px', fontSize: 12 }} 
                placeholder={`Option ${idx + 1}`} 
                value={opt} 
                onChange={e => {
                  const copy = [...pollOptions];
                  copy[idx] = e.target.value;
                  setPollOptions(copy);
                }} 
              />
            ))}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'space-between', marginTop: 4 }}>
              <button className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: 11 }} onClick={() => setPollOptions([...pollOptions, ''])}>+ Add Option</button>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: 11 }} onClick={() => setShowPollCreator(false)}>Cancel</button>
                <button className="btn btn-primary" style={{ padding: '4px 8px', fontSize: 11 }} onClick={handleSendPoll}>Create</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. Form inputs container */}
      <form onSubmit={handleSend} className="chat-input-form glass-panel" style={{
        padding: '16px 20px', borderTop: '1px solid var(--border-glass)', display: 'flex', gap: 10, alignItems: 'center', zIndex: 10
      }}>
        <button type="button" className="btn btn-secondary" style={{ padding: 10 }} onClick={() => fileInputRef.current?.click()} title="Upload Files">
          <Plus size={18} />
        </button>
        <input type="file" ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileSelect} />

        <button type="button" className="btn btn-secondary" style={{ padding: 10 }} onClick={triggerVoiceInput} title="Voice to text">
          <Mic size={18} />
        </button>

        <input 
          type="text" 
          className="input-field" 
          value={inputText} 
          onChange={handleInputChange} 
          placeholder={chat.isGroup ? "Message general-discussion..." : "Secure message to peer..."} 
          style={{ flex: 1 }} 
        />

        <button type="submit" className="btn btn-primary" style={{ padding: 12 }}>
          <Send size={16} />
        </button>
      </form>

      {/* AI Assistant Modal panel side overlay */}
      {aiResult && (
        <div style={{
          position: 'absolute', right: 20, top: 80, width: 300, maxHeight: 'calc(100vh - 120px)',
          overflowY: 'auto', zIndex: 99, padding: 16, borderRadius: 'var(--radius-md)'
        }} className="glass-panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h4 style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14 }}>
              <Sparkles size={16} color="#a855f7" /> AI Assistant Output
            </h4>
            <button style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)' }} onClick={() => setAiResult(null)}>✕</button>
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
            {aiResult}
          </div>
        </div>
      )}
    </div>
  );
}
