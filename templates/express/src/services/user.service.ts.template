import bcrypt from 'bcryptjs';
import { userRepository } from '../repositories/user.repository.js';
import { generateToken } from '../utils/jwt.js';
import { AppError } from '../middleware/error-handler.js';

export class UserService {
  async register(data: { email: string; password: string; name: string }) {
    const existingUser = await userRepository.findByEmail(data.email);
    if (existingUser) {
      throw new AppError(400, 'User already exists');
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);
    const user = await userRepository.create({
      ...data,
      password: hashedPassword,
    });

    return {
      id: user.id,
      email: user.email,
      name: user.name,
    };
  }

  async login(data: { email: string; password: string }) {
    const user = await userRepository.findByEmail(data.email);
    if (!user) {
      throw new AppError(401, 'Invalid credentials');
    }

    const isValid = await bcrypt.compare(data.password, user.password);
    if (!isValid) {
      throw new AppError(401, 'Invalid credentials');
    }

    const token = generateToken({ id: user.id, email: user.email });

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    };
  }
}

export const userService = new UserService();