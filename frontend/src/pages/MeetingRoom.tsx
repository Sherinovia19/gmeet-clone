import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { LiveKitRoom, VideoConference, useChat, useParticipants, useRoomContext } from '@livekit/components-react';
import { LIVEKIT_URL, getToken } from '../lib/livekit';
import { useState, useEffect, useCallback } from 'react';
import {
  Mic, MicOff, Camera, CameraOff, ScreenShare,
  MessageSquare, Hand, PhoneOff, Lock, Unlock, Crown,
} from 'lucide-react';
import { RoomEvent, DataPacket_Kind } from 'livekit-client';
import MeetingTimer from '../components/MeetingTimer';
import ChatPanel from '../components/ChatPanel';
import ConfirmDialog from '../components/ConfirmDialog';

const HANDRAISE_TOPIC = 'handraise';

interface HandRaiseState {
  raised: boolean;
  raisedAt: number;
}

interface HandRaisePayload {
  identity: string;
  name: string;
  raised: boolean;
  raisedAt: number;
}

interface Notification {
  id: string;
  message: string;
}

function MeetingRoomInner({ code, identity }: { code: string; identity: string }) {
  const navigate = useNavigate();
  const room = useRoomContext();
  const [chatDrawerOpen, setChatDrawerOpen] = useState(false);
  const [participantDrawerOpen, setParticipantDrawerOpen] = useState(false);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [screenSharing, setScreenSharing] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [hostIdentity, setHostIdentity] = useState<string | null>(null);
  const [locked, setLocked] = useState(false);
  const [leaveDialog, setLeaveDialog] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<string | null>(null);
  const [handRaises, setHandRaises] = useState<Record<string, HandRaiseState>>({});
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const { chatMessages } = useChat();
  const participants = useParticipants();
  const isHost = hostIdentity === identity;
  const myHandRaised = handRaises[identity]?.raised ?? false;

  // Fetch host on mount
  useEffect(() => {
    fetch(`/api/rooms/${code}/host`)
      .then((r) => r.json())
      .then((d) => setHostIdentity(d.hostIdentity))
      .catch(console.error);
  }, [code]);

  // Unread badge
  useEffect(() => {
    if (!chatDrawerOpen && chatMessages.length > 0) setUnreadCount(chatMessages.length);
    if (chatDrawerOpen) setUnreadCount(0);
  }, [chatMessages, chatDrawerOpen]);

  // Add notification with auto-dismiss after 10s
  const addNotification = useCallback((message: string) => {
    const id = `${Date.now()}-${Math.random()}`;
    setNotifications((prev) => [...prev, { id, message }]);
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 10000);
  }, []);

  // Send hand raise via data channel
  const sendHandRaise = useCallback(async (raised: boolean) => {
    if (!room) return;
    const payload: HandRaisePayload = {
      identity,
      name: room.localParticipant.name || identity,
      raised,
      raisedAt: Date.now(),
    };
    const encoder = new TextEncoder();
    const data = encoder.encode(JSON.stringify(payload));
    await room.localParticipant.publishData(data, {
      reliable: true,
      topic: HANDRAISE_TOPIC,
    });
    // Update local state immediately
    setHandRaises((prev) => ({
      ...prev,
      [identity]: { raised, raisedAt: payload.raisedAt },
    }));
    if (raised) {
      addNotification(`You raised your hand`);
    }
  }, [room, identity, addNotification]);

  // Listen for hand raise data messages
  useEffect(() => {
    if (!room) return;

    const handleData = (data: Uint8Array, _participant: unknown, _kind: unknown, topic?: string) => {
      if (topic !== HANDRAISE_TOPIC) return;
      try {
        const payload: HandRaisePayload = JSON.parse(new TextDecoder().decode(data));
        setHandRaises((prev) => ({
          ...prev,
          [payload.identity]: { raised: payload.raised, raisedAt: payload.raisedAt },
        }));
        if (payload.raised && payload.identity !== identity) {
          addNotification(`${payload.name} raised their hand`);
        }
      } catch {
        // ignore malformed
      }
    };

    room.on(RoomEvent.DataReceived, handleData);
    return () => { room.off(RoomEvent.DataReceived, handleData); };
  }, [room, identity, addNotification]);

  const toggleHandRaise = () => sendHandRaise(!myHandRaised);

  const lowerParticipantHand = async (targetIdentity: string) => {
    if (!room || !isHost) return;
    const payload: HandRaisePayload = {
      identity: targetIdentity,
      name: participants.find((p) => p.identity === targetIdentity)?.name || targetIdentity,
      raised: false,
      raisedAt: Date.now(),
    };
    const encoder = new TextEncoder();
    const data = encoder.encode(JSON.stringify(payload));
    await room.localParticipant.publishData(data, {
      reliable: true,
      topic: HANDRAISE_TOPIC,
    });
    setHandRaises((prev) => ({
      ...prev,
      [targetIdentity]: { raised: false, raisedAt: Date.now() },
    }));
  };

  const handleLeave = () => {
    if (isHost) setLeaveDialog(true);
    else navigate(`/meeting/${code}/summary`);
  };

  const handleEndForAll = async () => {
    await fetch(`/api/rooms/${code}/end`, { method: 'POST' });
    navigate(`/meeting/${code}/summary`);
  };

  const handleHostLeaveOnly = async () => {
    const next = participants.find((p) => p.identity !== identity);
    if (next) {
      await fetch(`/api/rooms/${code}/host/transfer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newHostIdentity: next.identity }),
      });
    }
    navigate(`/meeting/${code}/summary`);
  };

  const handleRemoveParticipant = async (targetIdentity: string) => {
    await fetch(`/api/rooms/${code}/participants/${encodeURIComponent(targetIdentity)}`, {
      method: 'DELETE',
    });
    setRemoveTarget(null);
  };

  const handleToggleLock = async () => {
    const endpoint = locked ? 'unlock' : 'lock';
    const res = await fetch(`/api/rooms/${code}/${endpoint}`, { method: 'POST' });
    if (res.ok) setLocked(!locked);
  };

  return (
    <div className="meeting-room">
      {/* ── Notifications ── */}
      {notifications.length > 0 && (
        <div style={{
          position: 'fixed', top: 72, right: 16, zIndex: 500,
          display: 'flex', flexDirection: 'column', gap: 8,
        }}>
          {notifications.map((n) => (
            <div key={n.id} style={{
              background: 'rgba(30,30,30,0.95)', color: '#e0e0e0',
              borderRadius: 8, padding: '10px 16px', fontSize: 13,
              border: '1px solid #3a3a3a', backdropFilter: 'blur(8px)',
              display: 'flex', alignItems: 'center', gap: 8,
              boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
            }}>
              ✋ {n.message}
            </div>
          ))}
        </div>
      )}

      {/* ── Top bar ── */}
      <div className="top-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span className="room-code">Room: {code}</span>
          {locked && (
            <span style={{
              display: 'flex', alignItems: 'center', gap: 4,
              background: '#d93025', color: '#fff', borderRadius: 6,
              padding: '2px 8px', fontSize: 11, fontWeight: 600,
            }}>
              <Lock size={12} /> Locked
            </span>
          )}
        </div>
        <MeetingTimer />
        <button className="leave-button" onClick={handleLeave}>
          <PhoneOff size={18} /> Leave
        </button>
      </div>

      {/* ── Main content area ── */}
      <div className="main-area">
        <div className="video-grid">
          <VideoConference />
        </div>

        {/* Chat drawer */}
        {chatDrawerOpen && (
          <div className="side-drawer">
            <div className="side-drawer-header"><h3>Chat</h3></div>
            <ChatPanel />
          </div>
        )}

        {/* Participants drawer */}
        {participantDrawerOpen && (
          <div className="side-drawer">
            <div className="side-drawer-header">
              <h3>Participants ({participants.length})</h3>
            </div>
            <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {participants.map((p) => (
                <div key={p.identity} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  background: '#2a2a2a', borderRadius: 8, padding: '8px 12px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {p.identity === hostIdentity && <Crown size={14} color="#eab308" />}
                    {handRaises[p.identity]?.raised && <span style={{ fontSize: 14 }}>✋</span>}
                    <span style={{ fontSize: 13, color: '#e0e0e0' }}>
                      {p.name || p.identity}
                      {p.identity === identity && ' (you)'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {isHost && handRaises[p.identity]?.raised && p.identity !== identity && (
                      <button
                        onClick={() => lowerParticipantHand(p.identity)}
                        style={{
                          background: '#3a3a3a', border: 'none', color: '#eab308',
                          borderRadius: 6, padding: '4px 10px', fontSize: 11,
                          cursor: 'pointer', fontWeight: 500,
                        }}
                      >
                        Lower Hand
                      </button>
                    )}
                    {isHost && p.identity !== identity && (
                      <button
                        onClick={() => setRemoveTarget(p.identity)}
                        style={{
                          background: '#3a3a3a', border: 'none', color: '#ef4444',
                          borderRadius: 6, padding: '4px 10px', fontSize: 11,
                          cursor: 'pointer', fontWeight: 500,
                        }}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Bottom dock ── */}
      <div className="bottom-dock">
        <button className={`dock-btn ${!micOn ? 'active-off' : ''}`} onClick={() => setMicOn((v) => !v)}>
          {micOn ? <Mic size={20} /> : <MicOff size={20} />}
          <span>{micOn ? 'Mute' : 'Unmute'}</span>
        </button>

        <button className={`dock-btn ${!camOn ? 'active-off' : ''}`} onClick={() => setCamOn((v) => !v)}>
          {camOn ? <Camera size={20} /> : <CameraOff size={20} />}
          <span>{camOn ? 'Stop Camera' : 'Start Camera'}</span>
        </button>

        <button className={`dock-btn ${screenSharing ? 'active-on' : ''}`} onClick={() => setScreenSharing((v) => !v)}>
          <ScreenShare size={20} />
          <span>Share</span>
        </button>

        <button
          className={`dock-btn ${chatDrawerOpen ? 'active-on' : ''}`}
          onClick={() => { setChatDrawerOpen((v) => !v); setParticipantDrawerOpen(false); }}
        >
          <div style={{ position: 'relative', display: 'inline-flex' }}>
            <MessageSquare size={20} />
            {!chatDrawerOpen && unreadCount > 0 && (
              <span style={{
                position: 'absolute', top: -6, right: -6,
                background: '#ef4444', color: '#fff', borderRadius: '50%',
                fontSize: 10, fontWeight: 700, minWidth: 16, height: 16,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '0 3px', lineHeight: 1,
              }}>
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </div>
          <span>Chat</span>
        </button>

        <button
          className={`dock-btn ${myHandRaised ? 'active-on' : ''}`}
          onClick={toggleHandRaise}
        >
          <Hand size={20} />
          <span>{myHandRaised ? 'Lower Hand' : 'Raise Hand'}</span>
        </button>

        {isHost && (
          <button className={`dock-btn ${locked ? 'active-on' : ''}`} onClick={handleToggleLock}>
            {locked ? <Unlock size={20} /> : <Lock size={20} />}
            <span>{locked ? 'Unlock' : 'Lock'}</span>
          </button>
        )}

        <button
          className={`dock-btn ${participantDrawerOpen ? 'active-on' : ''}`}
          onClick={() => { setParticipantDrawerOpen((v) => !v); setChatDrawerOpen(false); }}
        >
          <Crown size={20} />
          <span>People</span>
        </button>

        <button className="dock-btn dock-btn-leave" onClick={handleLeave}>
          <PhoneOff size={20} />
          <span>Leave</span>
        </button>
      </div>

      {/* ── Dialogs ── */}
      {leaveDialog && (
        <ConfirmDialog
          title="Leave meeting"
          message="Do you want to end the meeting for everyone, or just leave?"
          confirmLabel="End for all"
          cancelLabel="Just leave"
          dangerous
          onConfirm={handleEndForAll}
          onCancel={handleHostLeaveOnly}
        />
      )}

      {removeTarget && (
        <ConfirmDialog
          title="Remove participant"
          message={`Remove ${participants.find((p) => p.identity === removeTarget)?.name || removeTarget} from the meeting?`}
          confirmLabel="Remove"
          cancelLabel="Cancel"
          dangerous
          onConfirm={() => handleRemoveParticipant(removeTarget)}
          onCancel={() => setRemoveTarget(null)}
        />
      )}

      <style>{`
        .meeting-room {
          display: flex; flex-direction: column; height: 100vh;
          background: #0f0f0f; color: #fff;
          font-family: 'Google Sans', 'Segoe UI', Arial, sans-serif;
        }
        .top-bar {
          display: flex; align-items: center; justify-content: space-between;
          padding: 12px 24px; background: #1a1a1a;
          border-bottom: 1px solid #2a2a2a; flex-shrink: 0; height: 56px;
        }
        .room-code { font-size: 14px; color: #aaa; letter-spacing: 0.5px; }
        .leave-button {
          display: flex; align-items: center; gap: 8px;
          background: #d93025; color: #fff; border: none;
          border-radius: 8px; padding: 8px 20px;
          font-size: 14px; font-weight: 500; cursor: pointer;
          transition: background 0.15s;
        }
        .leave-button:hover { background: #c5221f; }
        .main-area { flex: 1; display: flex; overflow: hidden; position: relative; }
        .video-grid { flex: 1; display: flex; align-items: center; justify-content: center; overflow: hidden; }
        .video-grid > * { width: 100%; height: 100%; }
        .side-drawer {
          width: 320px; background: #1a1a1a;
          border-left: 1px solid #2a2a2a;
          display: flex; flex-direction: column;
          flex-shrink: 0; overflow-y: auto;
        }
        .side-drawer-header { padding: 16px; border-bottom: 1px solid #2a2a2a; }
        .side-drawer-header h3 { font-size: 16px; font-weight: 500; margin: 0; }
        .bottom-dock {
          display: flex; align-items: center; justify-content: center;
          gap: 8px; padding: 12px 24px; background: #1a1a1a;
          border-top: 1px solid #2a2a2a; flex-shrink: 0; height: 80px;
        }
        .dock-btn {
          display: flex; flex-direction: column; align-items: center;
          justify-content: center; gap: 4px; background: #2a2a2a;
          color: #ddd; border: none; border-radius: 12px;
          padding: 10px 18px; font-size: 11px; font-weight: 500;
          cursor: pointer; transition: background 0.15s, color 0.15s; min-width: 64px;
        }
        .dock-btn:hover { background: #3a3a3a; color: #fff; }
        .dock-btn.active-off { background: #d93025; color: #fff; }
        .dock-btn.active-off:hover { background: #c5221f; }
        .dock-btn.active-on { background: #3b82f6; color: #fff; }
        .dock-btn.active-on:hover { background: #2563eb; }
        .dock-btn-leave { background: #d93025; color: #fff; }
        .dock-btn-leave:hover { background: #c5221f; }
      `}</style>
    </div>
  );
}

export default function MeetingRoom() {
  const { code } = useParams();
  const [params] = useSearchParams();
  const identity = params.get('identity') || 'guest';
  const [token, setToken] = useState<string>();

  useEffect(() => {
    getToken(code!, identity).then(setToken).catch(console.error);
  }, [code, identity]);

  if (!token) return <div style={{ color: '#fff', padding: 24 }}>Connecting...</div>;

  return (
    <LiveKitRoom serverUrl={LIVEKIT_URL} token={token} connect className="meeting-room">
      <MeetingRoomInner code={code!} identity={identity} />
    </LiveKitRoom>
  );
}
