import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/async-handler.js';
import { userService } from '../services/user.service.js';
import { ApiResponse } from '../utils/response.js';

export const register = asyncHandler(async (req: Request, res: Response) => {
  const user = await userService.register(req.body);
  ApiResponse.success(res, user, 'User registered successfully', 201);
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const result = await userService.login(req.body);
  ApiResponse.success(res, result, 'Login successful');
});