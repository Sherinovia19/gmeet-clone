import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Landing() {
  const navigate = useNavigate();
  const [joinCode, setJoinCode] = useState('');
  const [recentRooms, setRecentRooms] = useState<string[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem('recentRooms');
    if (stored) setRecentRooms(JSON.parse(stored));
  }, []);

  async function handleNewMeeting() {
    const res = await fetch('/api/rooms', { method: 'POST' });
    if (!res.ok) return alert('Could not create room');
    const { roomCode } = await res.json();
    navigate(`/prejoin?room=${roomCode}`);
  }

  async function handleJoin() {
    if (!joinCode.trim()) return;
    const res = await fetch(`/api/rooms/${joinCode}/validate`);
    if (res.status === 404) return alert('Room not found');
    if (res.status === 410) return alert('Meeting has expired');
    navigate(`/prejoin?room=${joinCode}`);
  }

  return (
    <div className="meet-home">
      <header className="topbar">
        <div className="logo">
          <span className="logo-icon">📹</span>
          <span className="logo-text">Gmeet</span>
        </div>
        <div className="top-actions">
          <button className="icon-btn" title="Help">❓</button>
          <button className="icon-btn" title="Settings">⚙️</button>
          <div className="avatar">U</div>
        </div>
      </header>

      <main className="home-content">
        <div className="left">
          <h1>Video calls and meetings for everyone</h1>
          <p>Connect, collaborate and celebrate from anywhere with Gmeet.</p>

          <div className="action-row">
            <button className="primary" onClick={handleNewMeeting}>
              <span className="btn-icon">＋</span> New meeting
            </button>

            <div className="join-box">
              <input
                placeholder="Enter a code or link"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
              />
              <button
                className="join-btn"
                onClick={handleJoin}
                disabled={!joinCode.trim()}
              >
                Join
              </button>
            </div>
          </div>

          {recentRooms.length > 0 && (
            <div className="recent-rooms">
              <h3>Recent meetings</h3>
              <ul>
                {recentRooms.map((r) => (
                  <li key={r}>
                    <button
                      className="recent-room-btn"
                      onClick={() => navigate(`/prejoin?room=${r}`)}
                    >
                      {r}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <hr className="divider" />
          <p className="hint-text">
            Learn more about <a href="#">Gmeet</a>
          </p>
        </div>

        <div className="right">
          <div className="mock-card">
            <span className="mock-icon">🎥</span>
          </div>
        </div>
      </main>
    </div>
  );
}
