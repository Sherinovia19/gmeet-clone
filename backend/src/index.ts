import express from 'express';
import cors from 'cors';
import { healthRouter } from './routes/health.js';
import { roomsRouter } from './routes/rooms.js';
import { errorHandler, AppError } from './middleware/errorHandler.js';
import { requestIdMiddleware } from './middleware/requestId.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Allowed origins — never reflect arbitrary Origin header
const ALLOWED_ORIGINS = (process.env.CORS_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim());

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. server-to-server, curl)
    if (!origin) return callback(null, true);
    if (ALLOWED_ORIGINS.includes(origin)) {
      return callback(null, true);
    }
    // Block unauthorized origins
    return callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-request-id'],
  exposedHeaders: ['x-request-id'],
  credentials: true,
  optionsSuccessStatus: 200,
}));

// Request ID + structured logging
app.use(requestIdMiddleware);

app.use(express.json());

// Routes
app.use('/api/health', healthRouter);
app.use('/api/rooms', roomsRouter);

// 404 handler for unknown routes
app.use((_req, _res, next) => {
  next(new AppError(404, 'NOT_FOUND', 'The requested resource was not found'));
});

// Global error handler
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(JSON.stringify({
    level: 'info',
    timestamp: new Date().toISOString(),
    message: `API server listening on :${PORT}`,
  }));
});
