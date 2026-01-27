import { Response } from 'express';

/**
 * Standard API response format
 */
export class ApiResponse {
  static success(res: Response, data: any, message = 'Success', statusCode = 200) {
    return res.status(statusCode).json({
      status: 'success',
      message,
      data,
    });
  }

  static error(res: Response, message: string, statusCode = 400) {
    return res.status(statusCode).json({
      status: 'error',
      message,
    });
  }
}