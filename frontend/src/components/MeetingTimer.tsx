import { useState, useEffect, useRef } from 'react';
import { useConnectionState, useRoomContext } from '@livekit/components-react';
import { ConnectionQuality, RoomEvent } from 'livekit-client';
import { QUALITY_MESSAGES } from '../config';

type QualityLevel = 'good' | 'unstable' | 'poor';

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) {
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function getQualityLevel(quality: ConnectionQuality): QualityLevel {
  switch (quality) {
    case ConnectionQuality.Excellent:
    case ConnectionQuality.Good:
      return 'good';
    case ConnectionQuality.Poor:
      return 'unstable';
    case ConnectionQuality.Lost:
      return 'poor';
    default:
      return 'good';
  }
}

export default function MeetingTimer() {
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const [qualityLevel, setQualityLevel] = useState<QualityLevel>('good');
  const connectionState = useConnectionState();
  const room = useRoomContext();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Start timer only when LiveKit connection is established
  useEffect(() => {
    if (connectionState === 'connected' && !running) {
      setRunning(true);
    }
  }, [connectionState]);

  // Tick every second once running
  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => setElapsed((s) => s + 1), 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running]);

  // Listen to LiveKit connection quality events
  useEffect(() => {
    if (!room) return;
    const handleQualityChange = (_participant: unknown, quality: ConnectionQuality) => {
      setQualityLevel(getQualityLevel(quality));
    };
    room.on(RoomEvent.ConnectionQualityChanged, handleQualityChange);
    return () => {
      room.off(RoomEvent.ConnectionQualityChanged, handleQualityChange);
    };
  }, [room]);

  const tooltipText = QUALITY_MESSAGES[qualityLevel];

  return (
    <div className="meeting-timer">
      <span className="meeting-timer__time">{formatTime(elapsed)}</span>
      <span
        className={`quality-indicator quality-${qualityLevel}`}
        title={tooltipText}
        aria-label={tooltipText}
      />
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
          cursor: help;
          transition: background 0.3s, box-shadow 0.3s;
        }
        .quality-good {
          background: #22c55e;
          box-shadow: 0 0 4px rgba(34, 197, 94, 0.5);
        }
        .quality-unstable {
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
