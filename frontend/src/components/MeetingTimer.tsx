import { useState, useEffect } from 'react';
import { useConnectionState } from '@livekit/components-react';

type Quality = 'good' | 'fair' | 'poor';

function getQuality(connectionState: string): Quality {
  switch (connectionState) {
    case 'connected':
      return 'good';
    case 'reconnecting':
      return 'fair';
    case 'connecting':
      return 'fair';
    default:
      return 'poor';
  }
}

export default function MeetingTimer() {
  const [elapsed, setElapsed] = useState(0);
  const connectionState = useConnectionState();
  const quality = getQuality(connectionState);

  useEffect(() => {
    const id = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const mm = String(Math.floor(elapsed / 60)).padStart(2, '0');
  const ss = String(elapsed % 60).padStart(2, '0');

  return (
    <div className="meeting-timer">
      <span className="meeting-timer__time">{mm}:{ss}</span>
      <span className={`quality-indicator quality-${quality}`} title={`Connection: ${quality}`} />

      <style>{`
        .meeting-timer {
          display: flex;
          align-items: center;
          gap: 10px;
          background: #0f0f0f;
          border: 1px solid #2a2a2a;
          border-radius: 8px;
          padding: 6px 14px;
          font-family: 'Google Sans', 'Segoe UI', Arial, sans-serif;
        }

        .meeting-timer__time {
          font-size: 13px;
          font-weight: 500;
          color: #e0e0e0;
          letter-spacing: 0.5px;
          font-variant-numeric: tabular-nums;
        }

        .quality-indicator {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          display: inline-block;
          flex-shrink: 0;
        }

        .quality-good {
          background: #22c55e;
          box-shadow: 0 0 4px rgba(34, 197, 94, 0.5);
        }

        .quality-fair {
          background: #eab308;
          box-shadow: 0 0 4px rgba(234, 179, 8, 0.5);
        }

        .quality-poor {
          background: #ef4444;
          box-shadow: 0 0 4px rgba(239, 68, 68, 0.5);
        }
      `}</style>
    </div>
  );
}
