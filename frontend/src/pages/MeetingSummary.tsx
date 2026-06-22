import { useParams, useNavigate, useLocation } from 'react-router-dom';

interface LocationState {
  duration?: string;
}

export default function MeetingSummary() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState | null;
  const duration = state?.duration ?? '00:00';

  const meetingLink = `${window.location.origin}/prejoin?room=${code}`;

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(meetingLink);
    } catch {
      /* clipboard not available */
    }
  }

  return (
    <div className="summary-page min-h-screen bg-[#0f0f0f] flex items-center justify-center p-4">
      <div className="summary-card w-full max-w-md bg-[#1a1a1a] rounded-2xl shadow-2xl p-8 text-center">
        {/* Icon */}
        <div className="text-5xl mb-4">📹</div>

        {/* Heading */}
        <h1 className="text-2xl font-semibold text-white mb-2">Meeting ended</h1>

        {/* Stats */}
        <div className="summary-stats space-y-2 mb-6">
          <p className="text-gray-400 text-sm">
            Room: <span className="text-white font-mono">{code}</span>
          </p>
          <p className="text-gray-400 text-sm">
            Duration: <span className="text-white font-mono">{duration}</span>
          </p>
          <p className="text-gray-400 text-sm">
            Participants: <span className="text-white">—</span>
          </p>
        </div>

        {/* Actions */}
        <div className="summary-actions flex flex-col gap-3">
          <button
            onClick={() => navigate('/')}
            className="w-full py-2.5 px-4 rounded-lg bg-[#3b82f6] hover:bg-[#2563eb] text-white font-medium transition-colors"
          >
            Return to Home
          </button>
          <button
            onClick={handleCopyLink}
            className="w-full py-2.5 px-4 rounded-lg border border-gray-600 text-gray-300 hover:bg-[#252525] hover:text-white font-medium transition-colors"
          >
            Copy meeting link
          </button>
        </div>
      </div>
    </div>
  );
}
