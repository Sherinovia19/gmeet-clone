import { Router } from 'express';

export const healthRouter = Router();

// Since this project uses in-memory Map (no real DB),
// we simulate DB health — always connected unless explicitly set otherwise
let dbHealthy = true;

export function setDbHealth(healthy: boolean) {
  dbHealthy = healthy;
}

healthRouter.get('/', async (_req, res) => {
  const uptime = process.uptime();

  if (!dbHealthy) {
    return res.status(503).json({
      status: 'degraded',
      uptime,
      db: 'disconnected',
    });
  }

  res.status(200).json({
    status: 'ok',
    uptime,
    db: 'connected',
  });
});
