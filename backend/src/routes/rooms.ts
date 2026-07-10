import { Router } from 'express';
import {
  createRoom,
  validateRoom,
  joinRoom,
  getHost,
  lockRoom,
  unlockRoom,
  removeParticipant,
  transferHost,
  endRoom,
} from '../services/room.service.js';
import { issueToken } from '../services/jwt.service.js';

export const roomsRouter = Router();

// Create room
roomsRouter.post('/', async (req, res, next) => {
  try {
    const room = await createRoom();
    res.status(201).json({ roomCode: room.code, createdAt: room.createdAt });
  } catch (err) {
    next(err);
  }
});

// Validate room
roomsRouter.get('/:code/validate', async (req, res, next) => {
  try {
    const result = await validateRoom(req.params.code);
    if (!result) return res.status(404).json({ valid: false, error: 'Room not found' });
    if (result.expired) return res.status(410).json({ valid: false, error: 'Meeting has expired' });
    if (result.locked) return res.status(423).json({ valid: false, error: 'Meeting is locked' });
    res.json({ valid: true, participantCount: result.count });
  } catch (err) {
    next(err);
  }
});

// Issue token + join room (tracks first joiner as host)
roomsRouter.get('/:code/token', async (req, res, next) => {
  try {
    const identity = (req.query.identity as string) || `guest-${crypto.randomUUID().slice(0, 4)}`;
    const joined = await joinRoom(req.params.code, identity);
    if (!joined) {
      return res.status(423).json({ error: 'Meeting is locked' });
    }
    const token = await issueToken(req.params.code, identity);
    res.json({ token });
  } catch (err) {
    next(err);
  }
});

// Get host identity
roomsRouter.get('/:code/host', async (req, res, next) => {
  try {
    const host = await getHost(req.params.code);
    if (host === null) return res.status(404).json({ error: 'Room not found' });
    res.json({ hostIdentity: host });
  } catch (err) {
    next(err);
  }
});

// Lock room
roomsRouter.post('/:code/lock', async (req, res, next) => {
  try {
    const success = await lockRoom(req.params.code);
    if (!success) return res.status(404).json({ error: 'Room not found' });
    res.json({ locked: true });
  } catch (err) {
    next(err);
  }
});

// Unlock room
roomsRouter.post('/:code/unlock', async (req, res, next) => {
  try {
    const success = await unlockRoom(req.params.code);
    if (!success) return res.status(404).json({ error: 'Room not found' });
    res.json({ locked: false });
  } catch (err) {
    next(err);
  }
});

// Remove participant
roomsRouter.delete('/:code/participants/:identity', async (req, res, next) => {
  try {
    const result = await removeParticipant(req.params.code, req.params.identity);
    if (!result) return res.status(404).json({ error: 'Room not found' });
    res.json({ removed: true, newHost: result.newHost });
  } catch (err) {
    next(err);
  }
});

// Transfer host
roomsRouter.post('/:code/host/transfer', async (req, res, next) => {
  try {
    const { newHostIdentity } = req.body;
    const success = await transferHost(req.params.code, newHostIdentity);
    if (!success) return res.status(404).json({ error: 'Room not found' });
    res.json({ hostIdentity: newHostIdentity });
  } catch (err) {
    next(err);
  }
});

// End meeting for all
roomsRouter.post('/:code/end', async (req, res, next) => {
  try {
    const success = await endRoom(req.params.code);
    if (!success) return res.status(404).json({ error: 'Room not found' });
    res.json({ ended: true });
  } catch (err) {
    next(err);
  }
});
