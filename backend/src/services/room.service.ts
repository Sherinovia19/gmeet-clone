interface RoomRecord {
  code: string;
  status: 'active' | 'expired';
  createdAt: Date;
  endedAt?: Date;
  hostIdentity?: string;
  locked: boolean;
  participants: string[]; // join order for host transfer
}

const rooms = new Map<string, RoomRecord>();

function generateCode(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let code = '';
  for (let i = 0; i < 10; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

export async function createRoom(): Promise<RoomRecord> {
  const code = generateCode();
  const room: RoomRecord = {
    code,
    status: 'active',
    createdAt: new Date(),
    locked: false,
    participants: [],
  };
  rooms.set(code, room);
  return room;
}

export async function validateRoom(
  code: string
): Promise<{ expired: boolean; count: number; locked: boolean } | null> {
  const room = rooms.get(code);
  if (!room) return null;
  const expired = Date.now() - room.createdAt.getTime() > 24 * 60 * 60 * 1000;
  return { expired, count: room.participants.length, locked: room.locked };
}

export async function joinRoom(code: string, identity: string): Promise<boolean> {
  const room = rooms.get(code);
  if (!room) return false;
  if (room.locked) return false;
  if (!room.participants.includes(identity)) {
    room.participants.push(identity);
  }
  // First joiner becomes host
  if (!room.hostIdentity) {
    room.hostIdentity = identity;
  }
  return true;
}

export async function getHost(code: string): Promise<string | null> {
  const room = rooms.get(code);
  if (!room) return null;
  return room.hostIdentity || null;
}

export async function lockRoom(code: string): Promise<boolean> {
  const room = rooms.get(code);
  if (!room) return false;
  room.locked = true;
  return true;
}

export async function unlockRoom(code: string): Promise<boolean> {
  const room = rooms.get(code);
  if (!room) return false;
  room.locked = false;
  return true;
}

export async function removeParticipant(
  code: string,
  identity: string
): Promise<{ newHost: string | null } | null> {
  const room = rooms.get(code);
  if (!room) return null;
  room.participants = room.participants.filter((p) => p !== identity);
  let newHost: string | null = null;
  // Transfer host if host was removed
  if (room.hostIdentity === identity) {
    newHost = room.participants[0] || null;
    room.hostIdentity = newHost || undefined;
  }
  return { newHost };
}

export async function transferHost(
  code: string,
  newHostIdentity: string
): Promise<boolean> {
  const room = rooms.get(code);
  if (!room) return false;
  room.hostIdentity = newHostIdentity;
  return true;
}

export async function endRoom(code: string): Promise<boolean> {
  const room = rooms.get(code);
  if (!room) return false;
  room.status = 'expired';
  room.endedAt = new Date();
  room.participants = [];
  return true;
}
