export class WebRTCService {
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];

  async getLocalStream(video: boolean = true, audio: boolean = true): Promise<MediaStream> {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: video ? { width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30 } } : false,
        audio: audio
      });
      return this.localStream;
    } catch (err) {
      console.warn('Microphone/Camera access denied or unavailable, creating mock stream canvas:', err);
      return this.createMockStream(video, audio);
    }
  }

  async getDisplayStream(): Promise<MediaStream> {
    try {
      return await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true
      });
    } catch (err) {
      console.warn('Display media cancelled or unsupported:', err);
      throw err;
    }
  }

  applyBackgroundBlur(videoTrack: MediaStreamTrack, canvas: HTMLCanvasElement): MediaStreamTrack {
    const videoElem = document.createElement('video');
    videoElem.srcObject = new MediaStream([videoTrack]);
    videoElem.play();

    const ctx = canvas.getContext('2d');
    canvas.width = 1280;
    canvas.height = 720;

    const processFrame = () => {
      if (ctx && videoElem.readyState >= 2) {
        ctx.filter = 'blur(12px)';
        ctx.drawImage(videoElem, 0, 0, canvas.width, canvas.height);

        ctx.filter = 'none';
        ctx.save();
        ctx.beginPath();
        ctx.ellipse(canvas.width / 2, canvas.height / 2, 280, 340, 0, 0, 2 * Math.PI);
        ctx.clip();
        ctx.drawImage(videoElem, 0, 0, canvas.width, canvas.height);
        ctx.restore();
      }
      requestAnimationFrame(processFrame);
    };

    processFrame();
    const blurredStream = canvas.captureStream(30);
    return blurredStream.getVideoTracks()[0];
  }

  startRecording(stream: MediaStream): void {
    this.recordedChunks = [];
    try {
      this.mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp8,opus' });
    } catch (e) {
      this.mediaRecorder = new MediaRecorder(stream);
    }

    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        this.recordedChunks.push(event.data);
      }
    };

    this.mediaRecorder.start(1000);
  }

  stopRecordingAndDownload(filename: string = 'call-recording.webm'): void {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
      setTimeout(() => {
        const blob = new Blob(this.recordedChunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
        }, 100);
      }, 500);
    }
  }

  private createMockStream(_video: boolean, audio: boolean): MediaStream {
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 480;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      let angle = 0;
      setInterval(() => {
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = '#6366f1';
        ctx.beginPath();
        ctx.arc(canvas.width / 2 + Math.cos(angle) * 80, canvas.height / 2 + Math.sin(angle) * 50, 40, 0, Math.PI * 2);
        ctx.fill();
        angle += 0.05;

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 20px Inter, sans-serif';
        ctx.fillText('HD WebRTC Video Feed', 200, 40);
      }, 33);
    }

    const videoStream = canvas.captureStream(30);
    const tracks: MediaStreamTrack[] = [...videoStream.getVideoTracks()];

    if (audio) {
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const dst = audioCtx.createMediaStreamDestination();
        osc.connect(dst);
        tracks.push(...dst.stream.getAudioTracks());
      } catch (e) {
        console.warn('AudioContext fallback silent audio stream');
      }
    }

    return new MediaStream(tracks);
  }

  stopAllStreams(): void {
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }
    if (this.remoteStream) {
      this.remoteStream.getTracks().forEach(track => track.stop());
      this.remoteStream = null;
    }
  }
}

export const webrtcService = new WebRTCService();
