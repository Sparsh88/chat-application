import { useState, useEffect, useRef, useContext } from 'react';
import { 
  Video, VideoOff, Mic, MicOff, Monitor, PhoneOff, 
  Hand, EyeOff, Tv
} from 'lucide-react';
import { AuthContext, CallContext, SocketContext } from '../App.tsx';

export default function CallWindow() {
  const { user } = useContext(AuthContext)!;
  const { socket } = useContext(SocketContext)!;
  const { activeCall, acceptCall, rejectCall, endCall, isCallJoined } = useContext(CallContext)!;

  // Media toggles
  const [videoOn, setVideoOn] = useState(true);
  const [audioOn, setAudioOn] = useState(true);
  const [screenShare, setScreenShare] = useState(false);
  const [blurBackground, setBlurBackground] = useState(false);
  const [handRaised, setHandRaised] = useState(false);
  const [otherHandRaised, setOtherHandRaised] = useState(false);
  
  // Call Metrics
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  // 1. Manage call timer
  useEffect(() => {
    let interval: any;
    if (isCallJoined) {
      interval = setInterval(() => {
        setSecondsElapsed(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isCallJoined]);

  // 2. Fetch local camera stream
  useEffect(() => {
    if (isCallJoined) {
      navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        .then(stream => {
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
          }
          
          // In a production WebRTC setup, we would instantiate standard RTCPeerConnection:
          // const pc = new RTCPeerConnection(stunConfig);
          // stream.getTracks().forEach(track => pc.addTrack(track, stream));
          // We bind pc.onicecandidate, pc.ontrack, etc. and exchange signals via socket.
        })
        .catch(err => {
          console.warn('Local device camera access denied, rendering placeholder stream: ', err);
        });
    }

    // Connect remote signals triggers
    if (socket && activeCall) {
      socket.on('participant_action', ({ userId, action, state }) => {
        if (userId === activeCall.partnerId) {
          if (action === 'raise_hand') setOtherHandRaised(state);
        }
      });

      return () => {
        socket.off('participant_action');
      };
    }
  }, [isCallJoined, socket, activeCall]);

  const handleActionToggle = (action: string, currentState: boolean, setter: (v: boolean) => void) => {
    const newState = !currentState;
    setter(newState);
    
    if (socket && activeCall) {
      socket.emit('call_action', {
        roomId: activeCall.roomId,
        userId: user!.id,
        action,
        state: newState
      });
    }
  };

  // Picture in Picture triggers
  const triggerPiP = async () => {
    if (localVideoRef.current && document.pictureInPictureEnabled) {
      try {
        await localVideoRef.current.requestPictureInPicture();
      } catch (err) {
        alert('PiP transition failed');
      }
    }
  };

  const formatTime = (totalSecs: number) => {
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    return [
      hrs > 0 ? String(hrs).padStart(2, '0') : null,
      String(mins).padStart(2, '0'),
      String(secs).padStart(2, '0')
    ].filter(Boolean).join(':');
  };

  if (!activeCall) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(5, 5, 8, 0.95)', zIndex: 1000,
      display: 'flex', flexDirection: 'column', padding: 24
    }}>
      
      {/* Upper Status Panel */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <span style={{ fontSize: 12, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
            {activeCall.type === 'VIDEO' ? 'HD Video Room' : 'Encrypted Voice Room'}
          </span>
          <h2 style={{ fontSize: 18, color: '#fff' }}>Session Code: {activeCall.roomId}</h2>
        </div>
        
        {isCallJoined ? (
          <div className="glass-panel" style={{ padding: '8px 16px', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="pulse-indicator" style={{ backgroundColor: '#22c55e' }}></span>
            <span style={{ fontSize: 14, color: '#fff', fontFamily: 'monospace' }}>{formatTime(secondsElapsed)}</span>
          </div>
        ) : (
          <div style={{ color: 'var(--text-secondary)' }}>Awaiting Call Connect...</div>
        )}
      </div>

      {/* Main Grid View */}
      <div style={{
        flex: 1, display: 'grid', gridTemplateColumns: activeCall.type === 'VIDEO' ? '1fr 1fr' : '1fr', 
        gap: 20, minHeight: 0, marginBottom: 24
      }}>
        
        {/* Local Stream camera panel */}
        <div style={{
          position: 'relative', background: '#12141c', borderRadius: 16, overflow: 'hidden',
          border: '1px solid var(--border-glass)', display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          {activeCall.type === 'VIDEO' && videoOn ? (
            <video 
              ref={localVideoRef} 
              autoPlay 
              playsInline 
              muted 
              style={{
                width: '100%', height: '100%', objectFit: 'cover',
                filter: blurBackground ? 'blur(12px)' : 'none', transition: 'filter 0.3s ease'
              }}
            />
          ) : (
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--primary-gradient)', margin: '0 auto 12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: 24, color: '#fff' }}>{user?.username.charAt(0)}</span>
              </div>
              <h4 style={{ color: '#fff' }}>You (Camera Off)</h4>
            </div>
          )}

          {/* User state indicator badges overlay */}
          <div style={{ position: 'absolute', bottom: 16, left: 16, display: 'flex', gap: 6 }}>
            {handRaised && (
              <span style={{ padding: '4px 8px', background: '#eab308', borderRadius: 6, fontSize: 12, display: 'flex', alignItems: 'center', gap: 4, color: '#000' }}>
                <Hand size={12} /> Hand Raised
              </span>
            )}
            {!audioOn && (
              <span style={{ padding: '4px 8px', background: '#ef4444', borderRadius: 6, fontSize: 12, display: 'flex', alignItems: 'center', gap: 4, color: '#fff' }}>
                <MicOff size={12} /> Muted
              </span>
            )}
          </div>
        </div>

        {/* Remote Stream camera panel */}
        {activeCall.type === 'VIDEO' && (
          <div style={{
            position: 'relative', background: '#12141c', borderRadius: 16, overflow: 'hidden',
            border: '1px solid var(--border-glass)', display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            {isCallJoined ? (
              // In production we would map pc.ontrack stream, for demo we mock by mirroring local stream or rendering avatar
              <video 
                ref={remoteVideoRef} 
                autoPlay 
                playsInline 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <div style={{ textAlign: 'center' }}>
                <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-glass)', margin: '0 auto 12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: 24, color: 'var(--text-secondary)' }}>👤</span>
                </div>
                <h4 style={{ color: 'var(--text-secondary)' }}>Ringing Partner...</h4>
              </div>
            )}

            {/* Remote user badges */}
            <div style={{ position: 'absolute', bottom: 16, left: 16, display: 'flex', gap: 6 }}>
              {otherHandRaised && (
                <span style={{ padding: '4px 8px', background: '#eab308', borderRadius: 6, fontSize: 12, display: 'flex', alignItems: 'center', gap: 4, color: '#000' }}>
                  <Hand size={12} /> Hand Raised
                </span>
              )}
            </div>
          </div>
        )}

      </div>

      {/* Calling Screen acceptance controls */}
      {!isCallJoined && activeCall.isIncoming && (
        <div className="glass-panel" style={{
          margin: '0 auto 24px', padding: 20, borderRadius: 12, display: 'flex', 
          flexDirection: 'column', alignItems: 'center', gap: 14, width: 340
        }}>
          <h4 style={{ color: '#fff' }}>Incoming WebRTC call invitation</h4>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-secondary" style={{ color: 'var(--accent-color)' }} onClick={rejectCall}>Decline</button>
            <button className="btn btn-primary" onClick={acceptCall}>Accept & Connect</button>
          </div>
        </div>
      )}

      {/* Master Controls panel bar */}
      <div className="glass-panel" style={{
        margin: '0 auto', padding: '16px 32px', borderRadius: 24, display: 'flex', 
        gap: 16, alignItems: 'center', border: '1px solid var(--border-glass)'
      }}>
        
        {/* Toggle Audio */}
        <button 
          className={`btn ${audioOn ? 'btn-secondary' : 'btn-primary'}`} 
          style={{ padding: 12, borderRadius: '50%', backgroundColor: audioOn ? '' : '#ef4444' }}
          onClick={() => handleActionToggle('mute', audioOn, setAudioOn)}
          title={audioOn ? 'Mute Mic' : 'Unmute Mic'}
        >
          {audioOn ? <Mic size={20} /> : <MicOff size={20} />}
        </button>

        {/* Toggle Video */}
        {activeCall.type === 'VIDEO' && (
          <button 
            className={`btn ${videoOn ? 'btn-secondary' : 'btn-primary'}`} 
            style={{ padding: 12, borderRadius: '50%', backgroundColor: videoOn ? '' : '#ef4444' }}
            onClick={() => handleActionToggle('video', videoOn, setVideoOn)}
            title={videoOn ? 'Stop Camera' : 'Start Camera'}
          >
            {videoOn ? <Video size={20} /> : <VideoOff size={20} />}
          </button>
        )}

        {/* Screen Share */}
        {activeCall.type === 'VIDEO' && (
          <button 
            className={`btn ${screenShare ? 'btn-primary' : 'btn-secondary'}`} 
            style={{ padding: 12, borderRadius: '50%' }}
            onClick={() => handleActionToggle('screen_share', screenShare, setScreenShare)}
            title="Share Screen"
          >
            <Monitor size={20} />
          </button>
        )}

        {/* Blur Background filter */}
        {activeCall.type === 'VIDEO' && (
          <button 
            className={`btn ${blurBackground ? 'btn-primary' : 'btn-secondary'}`} 
            style={{ padding: 12, borderRadius: '50%' }}
            onClick={() => setBlurBackground(!blurBackground)}
            title="Blur Background"
          >
            <EyeOff size={20} />
          </button>
        )}

        {/* Raise Hand */}
        <button 
          className={`btn ${handRaised ? 'btn-primary' : 'btn-secondary'}`} 
          style={{ padding: 12, borderRadius: '50%', backgroundColor: handRaised ? '#eab308' : '', color: handRaised ? '#000' : '' }}
          onClick={() => handleActionToggle('raise_hand', handRaised, setHandRaised)}
          title="Raise Hand"
        >
          <Hand size={20} />
        </button>

        {/* Picture in Picture */}
        {activeCall.type === 'VIDEO' && (
          <button 
            className="btn btn-secondary" 
            style={{ padding: 12, borderRadius: '50%' }}
            onClick={triggerPiP}
            title="Mini Picture-in-Picture"
          >
            <Tv size={20} />
          </button>
        )}

        <div style={{ width: 1, height: 32, background: 'var(--border-glass)', margin: '0 8px' }} />

        {/* Hangup button */}
        <button 
          className="btn btn-primary" 
          style={{ padding: 12, borderRadius: '50%', backgroundColor: '#ef4444', border: 'none' }}
          onClick={endCall}
          title="End Call Session"
        >
          <PhoneOff size={20} color="#fff" />
        </button>

      </div>

    </div>
  );
}
