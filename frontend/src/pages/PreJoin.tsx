import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
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
      createLocalTracks({ audio: micEnabled, video: true }).then(([audio, video]) => {
        if (videoRef.current && video) videoRef.current.srcObject = new MediaStream([video.mediaStreamTrack]);
      });
    }
  }, [camEnabled, micEnabled]);

  async function handleJoin() {
    const identity = name.trim() || `guest-${Math.random().toString(36).slice(2, 6)}`;
    const res = await fetch(`/api/rooms/${room}/token?identity=${encodeURIComponent(identity)}`);
    if (!res.ok) return alert('Failed to join');
    navigate(`/meeting/${room}?identity=${encodeURIComponent(identity)}`);
  }

  return (
    <div className="prejoin-page">
      {/* LEFT - VIDEO */}
      <div className="video-section">
        <div className="video-preview">
          {camEnabled ? (
            <video ref={videoRef} autoPlay muted playsInline />
          ) : (
            <div className="cam-off-avatar">
              {name ? name.charAt(0).toUpperCase() : 'U'}
            </div>
          )}

          <div className="device-row floating">
            <button
              className={`device-btn ${!micEnabled ? 'off' : ''}`}
              onClick={() => setMicEnabled(!micEnabled)}
              title={micEnabled ? 'Mute' : 'Unmute'}
            >
              {micEnabled ? '🎤' : '🔇'}
            </button>
            <button
              className={`device-btn ${!camEnabled ? 'off' : ''}`}
              onClick={() => setCamEnabled(!camEnabled)}
              title={camEnabled ? 'Turn off camera' : 'Turn on camera'}
            >
              {camEnabled ? '📷' : '🚫'}
            </button>
          </div>
        </div>
      </div>

      {/* RIGHT - JOIN PANEL */}
      <div className="join-panel">
        <h2>Ready to join?</h2>

        <input
          placeholder="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <button className="join-now-btn" onClick={handleJoin}>
          Join now
        </button>

        <p className="small">
          {room ? `Joining room: ${room}` : 'No room code provided'}
        </p>
      </div>
    </div>
  );
}
