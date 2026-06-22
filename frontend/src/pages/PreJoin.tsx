import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Mic, MicOff, Camera, CameraOff } from 'lucide-react';
import { createLocalTracks } from '../lib/livekit';

export default function PreJoin() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const room = params.get('room') || '';
  const videoRef = useRef<HTMLVideoElement>(null);
  const [name, setName] = useState('');
  const [micEnabled, setMicEnabled] = useState(true);
  const [camEnabled, setCamEnabled] = useState(true);

  useEffect(() => {
    if (camEnabled) {
      createLocalTracks({ audio: micEnabled, video: true }).then(([, video]) => {
        if (videoRef.current && video) videoRef.current.srcObject = new MediaStream([video.mediaStreamTrack]);
      });
    } else {
      if (videoRef.current) videoRef.current.srcObject = null;
    }
  }, [camEnabled, micEnabled]);

  async function handleJoin() {
    const identity = name.trim() || `guest-${Math.random().toString(36).slice(2, 6)}`;
    const res = await fetch(`/api/rooms/${room}/token?identity=${encodeURIComponent(identity)}`);
    if (!res.ok) return alert('Failed to join');
    navigate(`/meeting/${room}?identity=${encodeURIComponent(identity)}`);
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleJoin();
  };

  return (
    <div className="flex h-full w-full items-center justify-center bg-[#1a1a1a] p-4">
      <div className="flex w-full max-w-[880px] overflow-hidden rounded-2xl bg-[#2a2a2a] shadow-2xl">
        {/* Camera Preview */}
        <div className="relative flex aspect-[4/3] w-1/2 items-center justify-center overflow-hidden bg-[#0f0f0f]">
          {camEnabled ? (
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#3a3a3a]">
              <CameraOff className="h-8 w-8 text-[#888]" />
            </div>
          )}
          <div className="absolute bottom-3 left-3 rounded-md bg-black/60 px-2.5 py-1 text-xs font-medium text-white">
            {camEnabled ? 'Camera On' : 'Camera Off'}
          </div>
        </div>

        {/* Controls */}
        <div className="flex w-1/2 flex-col justify-center gap-6 p-8">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight text-white">
              Ready to join?
            </h1>
            <p className="text-sm text-[#aaa]">No one else is here</p>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="name-input"
              className="text-xs font-medium uppercase tracking-wider text-[#888]"
            >
              Your name
            </label>
            <input
              id="name-input"
              type="text"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full rounded-lg border border-[#444] bg-[#1f1f1f] px-4 py-3 text-sm text-white outline-none transition-colors placeholder:text-[#666] focus:border-[#5f6368] focus:ring-1 focus:ring-[#5f6368]"
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setMicEnabled(!micEnabled)}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
                micEnabled
                  ? 'bg-[#3a3a3a] text-white hover:bg-[#444]'
                  : 'bg-[#c62828] text-white hover:bg-[#b71c1c]'
              }`}
            >
              {micEnabled ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
              {micEnabled ? 'Mute' : 'Unmute'}
            </button>
            <button
              onClick={() => setCamEnabled(!camEnabled)}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
                camEnabled
                  ? 'bg-[#3a3a3a] text-white hover:bg-[#444]'
                  : 'bg-[#c62828] text-white hover:bg-[#b71c1c]'
              }`}
            >
              {camEnabled ? <Camera className="h-4 w-4" /> : <CameraOff className="h-4 w-4" />}
              {camEnabled ? 'Cam Off' : 'Cam On'}
            </button>
          </div>

          <button
            onClick={handleJoin}
            className="w-full rounded-lg bg-[#7c4dff] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#6c3ef0]"
          >
            Join now
          </button>
        </div>
      </div>
    </div>
  );
}
