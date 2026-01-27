import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt.js';
import { AppError } from './error-handler.js';

/**
 * Authentication middleware
 */
export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      throw new AppError(401, 'No token provided');
    }

    const decoded = verifyToken(token);
    req.user = decoded as any;

    next();
  } catch (error) {
    next(new AppError(401, 'Invalid token'));
  }
}