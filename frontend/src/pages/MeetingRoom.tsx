import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { LiveKitRoom, VideoConference } from '@livekit/components-react';
import { LIVEKIT_URL, getToken } from '../lib/livekit';
import { useState, useEffect } from 'react';
import {
  Mic,
  MicOff,
  Camera,
  CameraOff,
  ScreenShare,
  MessageSquare,
  Hand,
  PhoneOff,
} from 'lucide-react';
import MeetingTimer from '../components/MeetingTimer';
import ChatPanel from '../components/ChatPanel';

export default function MeetingRoom() {
  const { code } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const identity = params.get('identity') || 'guest';
  const [token, setToken] = useState<string>();
  const [chatDrawerOpen, setChatDrawerOpen] = useState(false);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [handRaised, setHandRaised] = useState(false);
  const [screenSharing, setScreenSharing] = useState(false);

  useEffect(() => {
    getToken(code!, identity).then(setToken).catch(console.error);
  }, [code, identity]);

  const handleLeave = () => {
    navigate(`/meeting/${code}/summary`);
  };

  if (!token) return <div>Connecting...</div>;

  return (
    <LiveKitRoom
      serverUrl={LIVEKIT_URL}
      token={token}
      connect
      className="meeting-room"
    >
      <div className="meeting-room">
        {/* ── Top bar ── */}
        <div className="top-bar">
          <span className="room-code">Room: {code}</span>
          <MeetingTimer />
          <button className="leave-button" onClick={handleLeave}>
            <PhoneOff size={18} />
            Leave
          </button>
        </div>

        {/* ── Main content area ── */}
        <div className="main-area">
          {/* Video grid */}
          <div className="video-grid">
            <VideoConference />
          </div>

          {/* Side drawer */}
          {chatDrawerOpen && (
            <div className="side-drawer">
              <div className="side-drawer-header">
                <h3>Participants</h3>
              </div>
              <div className="side-drawer-participants">
                <p className="placeholder-text">Participant list coming soon</p>
              </div>
              <ChatPanel />
            </div>
          )}
        </div>

        {/* ── Bottom dock ── */}
        <div className="bottom-dock">
          <button
            className={`dock-btn ${!micOn ? 'active-off' : ''}`}
            onClick={() => setMicOn((v) => !v)}
          >
            {micOn ? <Mic size={20} /> : <MicOff size={20} />}
            <span>{micOn ? 'Mute' : 'Unmute'}</span>
          </button>

          <button
            className={`dock-btn ${!camOn ? 'active-off' : ''}`}
            onClick={() => setCamOn((v) => !v)}
          >
            {camOn ? <Camera size={20} /> : <CameraOff size={20} />}
            <span>{camOn ? 'Stop Camera' : 'Start Camera'}</span>
          </button>

          <button
            className={`dock-btn ${screenSharing ? 'active-on' : ''}`}
            onClick={() => setScreenSharing((v) => !v)}
          >
            <ScreenShare size={20} />
            <span>Share</span>
          </button>

          <button
            className={`dock-btn ${chatDrawerOpen ? 'active-on' : ''}`}
            onClick={() => setChatDrawerOpen((v) => !v)}
          >
            <MessageSquare size={20} />
            <span>Chat</span>
          </button>

          <button
            className={`dock-btn ${handRaised ? 'active-on' : ''}`}
            onClick={() => setHandRaised((v) => !v)}
          >
            <Hand size={20} />
            <span>{handRaised ? 'Lower Hand' : 'Raise Hand'}</span>
          </button>

          <button className="dock-btn dock-btn-leave" onClick={handleLeave}>
            <PhoneOff size={20} />
            <span>Leave</span>
          </button>
        </div>
      </div>

      <style>{`
        .meeting-room {
          display: flex;
          flex-direction: column;
          height: 100vh;
          background: #0f0f0f;
          color: #fff;
          font-family: 'Google Sans', 'Segoe UI', Arial, sans-serif;
        }

        .top-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 24px;
          background: #1a1a1a;
          border-bottom: 1px solid #2a2a2a;
          flex-shrink: 0;
          height: 56px;
        }

        .room-code {
          font-size: 14px;
          color: #aaa;
          letter-spacing: 0.5px;
        }

        .leave-button {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #d93025;
          color: #fff;
          border: none;
          border-radius: 8px;
          padding: 8px 20px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.15s;
        }

        .leave-button:hover {
          background: #c5221f;
        }

        .main-area {
          flex: 1;
          display: flex;
          overflow: hidden;
          position: relative;
        }

        .video-grid {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }

        .video-grid > * {
          width: 100%;
          height: 100%;
        }

        .side-drawer {
          width: 320px;
          background: #1a1a1a;
          border-left: 1px solid #2a2a2a;
          display: flex;
          flex-direction: column;
          flex-shrink: 0;
          overflow-y: auto;
        }

        .side-drawer-header {
          padding: 16px;
          border-bottom: 1px solid #2a2a2a;
        }

        .side-drawer-header h3 {
          font-size: 16px;
          font-weight: 500;
          margin: 0;
        }

        .side-drawer-participants {
          padding: 16px;
        }

        .placeholder-text {
          color: #888;
          font-size: 13px;
        }

        .bottom-dock {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 12px 24px;
          background: #1a1a1a;
          border-top: 1px solid #2a2a2a;
          flex-shrink: 0;
          height: 80px;
        }

        .dock-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 4px;
          background: #2a2a2a;
          color: #ddd;
          border: none;
          border-radius: 12px;
          padding: 10px 18px;
          font-size: 11px;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.15s, color 0.15s;
          min-width: 64px;
        }

        .dock-btn:hover {
          background: #3a3a3a;
          color: #fff;
        }

        .dock-btn.active-off {
          background: #d93025;
          color: #fff;
        }

        .dock-btn.active-off:hover {
          background: #c5221f;
        }

        .dock-btn.active-on {
          background: #3b82f6;
          color: #fff;
        }

        .dock-btn.active-on:hover {
          background: #2563eb;
        }

        .dock-btn-leave {
          background: #d93025;
          color: #fff;
        }

        .dock-btn-leave:hover {
          background: #c5221f;
        }
      `}</style>
    </LiveKitRoom>
  );
}
