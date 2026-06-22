/// <reference types="vite/client" />
import { LiveKitRoom } from '@livekit/components-react';
import '@livekit/components-styles';
import { createLocalTracks } from 'livekit-client';

const LIVEKIT_URL = import.meta.env.VITE_LIVEKIT_URL || 'ws://localhost:7880';

export async function getToken(room: string, identity: string): Promise<string> {
  const res = await fetch(`/api/rooms/${room}/token?identity=${encodeURIComponent(identity)}`);
  if (!res.ok) throw new Error('Failed to get token');
  const data = await res.json();
  return data.token;
}

export { LIVEKIT_URL, LiveKitRoom, createLocalTracks };
