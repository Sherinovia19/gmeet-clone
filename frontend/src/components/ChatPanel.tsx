import { useState, useRef, useEffect } from 'react';
import { useChat } from '@livekit/components-react';
import { Send } from 'lucide-react';

export default function ChatPanel() {
  const { chatMessages, send, isSending } = useChat();
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isSending) return;
    setInput('');
    try {
      await send(text);
    } catch {
      // swallow — LiveKit rejects silently when not connected
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSend();
  };

  return (
    <div className="chat-panel">
      <div className="chat-messages">
        {chatMessages.length === 0 && (
          <p className="chat-empty">No messages yet</p>
        )}

        {chatMessages.map((msg) => {
          const name = msg.from?.name ?? msg.from?.identity ?? 'Unknown';
          const time = new Date(msg.timestamp);
          const timeStr = time.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          });

          return (
            <div
              key={msg.id ?? msg.timestamp}
              className={`chat-message${msg.from?.isLocal ? ' chat-message--own' : ''}`}
            >
              <div className="chat-message__meta">
                <span className="chat-message__name">{name}</span>
                <span className="chat-message__time">{timeStr}</span>
              </div>
              <div className="chat-message__text">{msg.message}</div>
            </div>
          );
        })}

        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input">
        <input
          type="text"
          placeholder="Send a message…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isSending}
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || isSending}
          aria-label="Send message"
        >
          <Send size={18} />
        </button>
      </div>

      <style>{`
        .chat-panel {
          display: flex;
          flex-direction: column;
          flex: 1;
          min-height: 0;
          border-top: 1px solid #2a2a2a;
        }

        .chat-messages {
          flex: 1;
          overflow-y: auto;
          padding: 12px;
          display: flex;
          flex-direction: column;
          gap: 8px;
          scrollbar-width: thin;
          scrollbar-color: #3a3a3a transparent;
        }

        .chat-messages::-webkit-scrollbar {
          width: 6px;
        }

        .chat-messages::-webkit-scrollbar-thumb {
          background: #3a3a3a;
          border-radius: 3px;
        }

        .chat-empty {
          color: #666;
          font-size: 13px;
          text-align: center;
          margin: auto;
        }

        .chat-message {
          background: #2a2a2a;
          border-radius: 8px;
          padding: 8px 12px;
          max-width: 100%;
          word-break: break-word;
        }

        .chat-message--own {
          background: #1e3a5f;
        }

        .chat-message__meta {
          display: flex;
          align-items: baseline;
          gap: 8px;
          margin-bottom: 4px;
        }

        .chat-message__name {
          font-size: 12px;
          font-weight: 600;
          color: #3b82f6;
        }

        .chat-message--own .chat-message__name {
          color: #60a5fa;
        }

        .chat-message__time {
          font-size: 11px;
          color: #888;
        }

        .chat-message__text {
          font-size: 13px;
          color: #e0e0e0;
          line-height: 1.4;
        }

        .chat-input {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 12px;
          border-top: 1px solid #2a2a2a;
          background: #1a1a1a;
        }

        .chat-input input {
          flex: 1;
          background: #2a2a2a;
          border: 1px solid #3a3a3a;
          border-radius: 8px;
          padding: 8px 12px;
          font-size: 13px;
          color: #e0e0e0;
          outline: none;
          font-family: inherit;
          transition: border-color 0.15s;
        }

        .chat-input input::placeholder {
          color: #666;
        }

        .chat-input input:focus {
          border-color: #3b82f6;
        }

        .chat-input input:disabled {
          opacity: 0.5;
        }

        .chat-input button {
          display: flex;
          align-items: center;
          justify-content: center;
          background: #3b82f6;
          border: none;
          border-radius: 8px;
          padding: 8px;
          color: #fff;
          cursor: pointer;
          transition: background 0.15s;
          flex-shrink: 0;
        }

        .chat-input button:hover:not(:disabled) {
          background: #2563eb;
        }

        .chat-input button:disabled {
          background: #3a3a3a;
          color: #666;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}
