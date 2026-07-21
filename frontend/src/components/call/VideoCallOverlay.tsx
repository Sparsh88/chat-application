import React, { useRef, useEffect } from 'react';
import { Mic, MicOff, Video as VideoIcon, VideoOff, Monitor, Hand, Circle, PhoneOff, Sparkles, ShieldCheck, Download, Minimize2, Maximize2 } from 'lucide-react';
import { useCall } from '../../context/CallContext';

export const VideoCallOverlay: React.FC = () => {
  const { callState, endCall, toggleMute, toggleCamera, toggleScreenShare, toggleBackgroundBlur, toggleRaiseHand, toggleCallRecording, incomingCall, acceptCall, rejectCall } = useCall();
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const blurCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (localVideoRef.current && callState.localStream) {
      localVideoRef.current.srcObject = callState.localStream;
    }
  }, [callState.localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && callState.remoteStream) {
      remoteVideoRef.current.srcObject = callState.remoteStream;
    }
  }, [callState.remoteStream]);

  // Incoming Call Ringing Dialog
  if (incomingCall && !callState.isActive) {
    return (
      <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xl flex items-center justify-center p-4 z-50">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-sm flex flex-col items-center text-center space-y-4 shadow-2xl animate-pulse-glow">
          <img src={incomingCall.caller.avatar} alt="Caller" className="w-20 h-20 rounded-full object-cover ring-4 ring-indigo-500/50 shadow-xl" />
          <div>
            <h3 className="font-bold text-slate-100 text-lg">{incomingCall.caller.name}</h3>
            <p className="text-xs text-indigo-400 font-semibold mt-0.5">Incoming {incomingCall.isVideo ? 'HD Video' : 'Voice'} Call...</p>
          </div>
          <div className="flex items-center gap-4 pt-2">
            <button onClick={rejectCall} className="w-12 h-12 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center shadow-lg shadow-rose-600/40">
              <PhoneOff className="w-5 h-5" />
            </button>
            <button onClick={acceptCall} className="w-14 h-14 rounded-full bg-emerald-500 hover:bg-emerald-400 text-white flex items-center justify-center shadow-xl shadow-emerald-500/40 animate-bounce">
              <VideoIcon className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!callState.isActive) return null;

  const formatDuration = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-2xl flex flex-col z-50 select-none">
      <canvas ref={blurCanvasRef} className="hidden" />

      {/* Top Floating Bar */}
      <div className="h-16 px-6 flex items-center justify-between z-10 border-b border-slate-800/60">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-rose-500 animate-ping" />
          <span className="font-mono text-xs font-bold text-slate-200">{formatDuration(callState.durationSeconds)}</span>
          <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-md border border-emerald-500/30 flex items-center gap-1">
            <ShieldCheck className="w-3 h-3" /> WebRTC E2EE Stream
          </span>
          {callState.isRecording && (
            <span className="bg-rose-500/10 text-rose-400 text-[10px] font-bold px-2 py-0.5 rounded-md border border-rose-500/30 flex items-center gap-1 animate-pulse">
              <Circle className="w-2.5 h-2.5 fill-rose-500" /> Recording Call
            </span>
          )}
        </div>
      </div>

      {/* Main Stream Display Grid */}
      <div className="flex-1 p-6 grid grid-cols-1 md:grid-cols-2 gap-6 relative">
        {/* Remote Stream Video Card */}
        <div className="relative bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden flex items-center justify-center shadow-2xl">
          <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
          <div className="absolute bottom-4 left-4 bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800 text-xs font-semibold text-slate-200">
            {callState.recipientUser?.name || 'Remote Teammate'}
          </div>
        </div>

        {/* Local Stream Video Card */}
        <div className="relative bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden flex items-center justify-center shadow-2xl">
          {callState.isCameraOff ? (
            <div className="flex flex-col items-center gap-2">
              <div className="w-20 h-20 rounded-full bg-slate-800 flex items-center justify-center text-slate-500 text-2xl font-bold">
                📷
              </div>
              <span className="text-xs text-slate-400 font-medium">Camera Off</span>
            </div>
          ) : (
            <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
          )}
          <div className="absolute bottom-4 left-4 bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800 text-xs font-semibold text-slate-200">
            You (Alex Rivera)
          </div>
        </div>
      </div>

      {/* Bottom Controls Bar */}
      <div className="h-20 border-t border-slate-800/80 flex items-center justify-center gap-4 px-6 z-10 bg-slate-950/80">
        {/* Mute */}
        <button
          onClick={toggleMute}
          className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
            callState.isMuted ? 'bg-rose-600 text-white shadow-lg' : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
          }`}
        >
          {callState.isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </button>

        {/* Camera */}
        <button
          onClick={toggleCamera}
          className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
            callState.isCameraOff ? 'bg-rose-600 text-white shadow-lg' : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
          }`}
        >
          {callState.isCameraOff ? <VideoOff className="w-5 h-5" /> : <VideoIcon className="w-5 h-5" />}
        </button>

        {/* Screen Share */}
        <button
          onClick={toggleScreenShare}
          className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
            callState.isScreenSharing ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
          }`}
        >
          <Monitor className="w-5 h-5" />
        </button>

        {/* Background Blur */}
        <button
          onClick={() => toggleBackgroundBlur(blurCanvasRef.current || undefined)}
          className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
            callState.isBackgroundBlurred ? 'bg-purple-600 text-white shadow-lg' : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
          }`}
          title="Toggle Canvas Background Blur Filter"
        >
          <Sparkles className="w-5 h-5" />
        </button>

        {/* Raise Hand */}
        <button
          onClick={toggleRaiseHand}
          className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
            callState.isHandRaised ? 'bg-amber-500 text-white shadow-lg' : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
          }`}
        >
          <Hand className="w-5 h-5" />
        </button>

        {/* Record Call */}
        <button
          onClick={toggleCallRecording}
          className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
            callState.isRecording ? 'bg-rose-600 text-white shadow-lg animate-pulse' : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
          }`}
          title="Record Call (MediaRecorder API)"
        >
          <Download className="w-5 h-5" />
        </button>

        {/* End Call Button */}
        <button
          onClick={endCall}
          className="w-14 h-12 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center shadow-xl shadow-rose-600/40 ml-4"
        >
          <PhoneOff className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
};
