interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  dangerous?: boolean;
}

export default function ConfirmDialog({
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  dangerous = false,
}: ConfirmDialogProps) {
  return (
    <div className="confirm-overlay" onClick={onCancel}>
      <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
        <h3 className="confirm-title">{title}</h3>
        <p className="confirm-message">{message}</p>
        <div className="confirm-actions">
          <button className="confirm-btn confirm-cancel" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button
            className={`confirm-btn ${dangerous ? 'confirm-danger' : 'confirm-primary'}`}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>

      <style>{`
        .confirm-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }
        .confirm-dialog {
          background: #2a2a2a;
          border: 1px solid #3a3a3a;
          border-radius: 12px;
          padding: 24px;
          width: 360px;
          max-width: 90vw;
          box-shadow: 0 8px 32px rgba(0,0,0,0.5);
        }
        .confirm-title {
          font-size: 16px;
          font-weight: 600;
          color: #e0e0e0;
          margin: 0 0 8px;
        }
        .confirm-message {
          font-size: 13px;
          color: #aaa;
          margin: 0 0 20px;
          line-height: 1.5;
        }
        .confirm-actions {
          display: flex;
          gap: 10px;
          justify-content: flex-end;
        }
        .confirm-btn {
          padding: 8px 18px;
          border-radius: 8px;
          border: none;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.15s;
        }
        .confirm-cancel {
          background: #3a3a3a;
          color: #ddd;
        }
        .confirm-cancel:hover {
          background: #4a4a4a;
        }
        .confirm-primary {
          background: #3b82f6;
          color: #fff;
        }
        .confirm-primary:hover {
          background: #2563eb;
        }
        .confirm-danger {
          background: #d93025;
          color: #fff;
        }
        .confirm-danger:hover {
          background: #c5221f;
        }
      `}</style>
    </div>
  );
}
