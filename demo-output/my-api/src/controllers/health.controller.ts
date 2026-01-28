import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/async-handler.js';

/**
 * Health check endpoint
 */
export const healthCheck = asyncHandler(async (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});