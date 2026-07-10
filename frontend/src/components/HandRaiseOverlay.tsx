interface HandRaiseOverlayProps {
  name: string;
}

export default function HandRaiseOverlay({ name }: HandRaiseOverlayProps) {
  return (
    <div
      style={{
        position: 'absolute',
        top: 8,
        right: 8,
        background: 'rgba(0,0,0,0.7)',
        borderRadius: 8,
        padding: '4px 8px',
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        zIndex: 10,
        backdropFilter: 'blur(4px)',
      }}
      title={`${name} raised their hand`}
    >
      <span style={{ fontSize: 16 }}>✋</span>
    </div>
  );
}
