import { type Request, type Response, type NextFunction } from 'express';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
) {
  const requestId = (req as Request & { requestId?: string }).requestId || 'unknown';
  const timestamp = new Date().toISOString();

  if (err instanceof AppError) {
    // Structured log for known errors
    console.error(JSON.stringify({
      level: 'warn',
      timestamp,
      requestId,
      code: err.code,
      message: err.message,
      statusCode: err.statusCode,
    }));

    return res.status(err.statusCode).json({
      error: err.message,
      code: err.code,
    });
  }

  // Unknown/unexpected errors — log full details, never expose to client
  console.error(JSON.stringify({
    level: 'error',
    timestamp,
    requestId,
    message: err.message,
    stack: err.stack,
  }));

  res.status(500).json({
    error: 'An unexpected error occurred',
    code: 'INTERNAL_ERROR',
  });
}
