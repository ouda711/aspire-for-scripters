#!/usr/bin/env node

/**
 * Script to generate all Express.js template files
 * Run with: node scripts/generate-templates.mjs
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const templatesDir = path.join(__dirname, '../templates/express');

const templates = {
  // Base configuration files
  'base/.gitignore.template': `node_modules/
dist/
.env
.env.local
logs/
*.log
coverage/
.DS_Store
.vscode/
.idea/`,

  'base/.eslintrc.js.template': `module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    project: './tsconfig.json',
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  rules: {
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
  },
};`,

  'base/.prettierrc.template': `{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2
}`,

  'base/.env.example.template': `# Application
NODE_ENV=development
PORT=3000
{{#if hasDatabase}}

# Database
{{#if hasPostgres}}
DATABASE_URL=postgresql://user:password@localhost:5432/{{name}}
{{/if}}
{{#if hasMySQL}}
DATABASE_URL=mysql://user:password@localhost:3306/{{name}}
{{/if}}
{{#if hasMongoDB}}
MONGODB_URI=mongodb://localhost:27017/{{name}}
{{/if}}
{{#if hasRedis}}
REDIS_URL=redis://localhost:6379
{{/if}}
{{/if}}
{{#if includeAuth}}

# Authentication
JWT_SECRET=your-secret-key-change-this
JWT_EXPIRES_IN=7d
{{/if}}

# CORS
CORS_ORIGIN=*`,

  'base/README.md.template': `# {{name}}

{{#if description}}{{description}}{{else}}Express.js API built with Aspire for Scripters{{/if}}

## Features

- ✅ TypeScript
- ✅ Express.js
{{#if includeAuth}}- ✅ JWT Authentication{{/if}}
{{#if includeSwagger}}- ✅ API Documentation (Swagger){{/if}}
{{#if hasDatabase}}- ✅ Database Support{{/if}}
{{#if includeTesting}}- ✅ Jest Testing{{/if}}
{{#if includeDocker}}- ✅ Docker Support{{/if}}
{{#if includeCI}}- ✅ CI/CD Pipeline{{/if}}

## Getting Started

### Prerequisites

- Node.js >= 18
{{#if includeDocker}}- Docker and Docker Compose{{/if}}

### Installation

\`\`\`bash
{{packageManager}} install
\`\`\`

### Environment Variables

Copy \`.env.example\` to \`.env\` and update the values:

\`\`\`bash
cp .env.example .env
\`\`\`

{{#if includeDocker}}
### Running with Docker

\`\`\`bash
docker-compose up -d
{{packageManager}} run dev
\`\`\`
{{/if}}

### Running locally

\`\`\`bash
{{packageManager}} run dev
\`\`\`

The API will be available at \`http://localhost:3000\`
{{#if includeSwagger}}
API documentation will be available at \`http://localhost:3000/api-docs\`
{{/if}}

## Scripts

- \`{{packageManager}} run dev\` - Start development server
- \`{{packageManager}} run build\` - Build for production
- \`{{packageManager}} start\` - Start production server
- \`{{packageManager}} run lint\` - Lint code
- \`{{packageManager}} run format\` - Format code
{{#if includeTesting}}
- \`{{packageManager}} test\` - Run tests
- \`{{packageManager}} run test:watch\` - Run tests in watch mode
- \`{{packageManager}} run test:coverage\` - Run tests with coverage
{{/if}}

## Project Structure

\`\`\`
src/
├── config/          # Configuration files
├── controllers/     # Request handlers
├── middleware/      # Express middleware
├── models/          # Data models
├── routes/          # API routes
├── services/        # Business logic
├── utils/           # Utility functions
└── types/           # TypeScript types
\`\`\`

## License

MIT

Generated with [Aspire for Scripters](https://github.com/ouda711/aspire-for-scripters)`,

  'base/tsconfig.json.template': `{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "node",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "types": ["node"{{#if includeTesting}}, "jest"{{/if}}],
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"{{#if includeTesting}}, "tests"{{/if}}]
}`,

  'base/nodemon.json.template': `{
  "watch": ["src"],
  "ext": "ts,json",
  "ignore": ["src/**/*.test.ts"],
  "exec": "tsx src/index.ts"
}`,

  // Source files
  'src/index.ts.template': `import { createServer } from './server.js';
{{#if includeLogging}}
import { logger } from './utils/logger.js';
{{/if}}

/**
 * Application entry point
 */
async function main() {
  try {
    const server = await createServer();
    
    const port = process.env.PORT || 3000;
    server.listen(port, () => {
      {{#if includeLogging}}
      logger.info(\`Server running on port \${port}\`);
      logger.info(\`Environment: \${process.env.NODE_ENV || 'development'}\`);
      {{#if includeSwagger}}
      logger.info(\`API Documentation: http://localhost:\${port}/api-docs\`);
      {{/if}}
      {{else}}
      console.log(\`Server running on port \${port}\`);
      {{/if}}
    });
  } catch (error) {
    {{#if includeLogging}}
    logger.error('Failed to start server:', error);
    {{else}}
    console.error('Failed to start server:', error);
    {{/if}}
    process.exit(1);
  }
}

main();`,

  'src/app.ts.template': `import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
{{#if includeLogging}}
import { requestLogger } from './middleware/request-logger.js';
{{/if}}
import { errorHandler } from './middleware/error-handler.js';
import routes from './routes/index.js';
{{#if includeSwagger}}
import { setupSwagger } from './config/swagger.js';
{{/if}}

/**
 * Create and configure Express application
 */
export function createApp(): Application {
  const app = express();

  // Security middleware
  app.use(helmet());

  // CORS configuration
  app.use(
    cors({
      origin: process.env.CORS_ORIGIN || '*',
      credentials: true,
    })
  );

  // Body parsing middleware
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  {{#if includeLogging}}
  // Request logging
  app.use(requestLogger);
  {{/if}}

  {{#if includeSwagger}}
  // API Documentation
  setupSwagger(app);
  {{/if}}

  // API Routes
  app.use('/api/v1', routes);

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  });

  // Error handling middleware (must be last)
  app.use(errorHandler);

  return app;
}`,

  'src/server.ts.template': `import { Server } from 'http';
import { createApp } from './app.js';
{{#if hasDatabase}}
import { connectDatabase } from './database/connection.js';
{{/if}}

/**
 * Create and configure HTTP server
 */
export async function createServer(): Promise<Server> {
  {{#if hasDatabase}}
  // Connect to database
  await connectDatabase();
  {{/if}}

  const app = createApp();
  
  return app as any as Server;
}`,

  'src/config/index.ts.template': `export * from './app.config.js';
{{#if hasDatabase}}
export * from './database.config.js';
{{/if}}`,

  'src/config/app.config.ts.template': `export const appConfig = {
  port: parseInt(process.env.PORT || '3000', 10),
  env: process.env.NODE_ENV || 'development',
  corsOrigin: process.env.CORS_ORIGIN || '*',
};`,

  'src/middleware/error-handler.ts.template': `import { Request, Response, NextFunction } from 'express';
{{#if includeLogging}}
import { logger } from '../utils/logger.js';
{{/if}}

/**
 * Custom error class
 */
export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public isOperational = true
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

/**
 * Global error handler middleware
 */
export function errorHandler(
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) {
  {{#if includeLogging}}
  logger.error('Error:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
  });
  {{else}}
  console.error('Error:', err);
  {{/if}}

  // Handle known errors
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      status: 'error',
      message: err.message,
    });
  }

  // Handle unknown errors
  const statusCode = 500;
  const message =
    process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message;

  res.status(statusCode).json({
    status: 'error',
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
}`,

  'src/middleware/request-logger.ts.template': `import { Request, Response, NextFunction } from 'express';
{{#if includeLogging}}
import { logger } from '../utils/logger.js';
{{/if}}

/**
 * Request logging middleware
 */
export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    {{#if includeLogging}}
    logger.info(\`\${req.method} \${req.path} \${res.statusCode} - \${duration}ms\`);
    {{else}}
    console.log(\`\${req.method} \${req.path} \${res.statusCode} - \${duration}ms\`);
    {{/if}}
  });

  next();
}`,

  'src/middleware/async-handler.ts.template': `import { Request, Response, NextFunction } from 'express';

/**
 * Async handler wrapper to catch errors in async route handlers
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}`,

  'src/routes/index.ts.template': `import { Router } from 'express';
import healthRoutes from './health.routes.js';
{{#if includeAuth}}
import userRoutes from './user.routes.js';
{{/if}}

const router = Router();

router.use('/health', healthRoutes);
{{#if includeAuth}}
router.use('/users', userRoutes);
{{/if}}

export default router;`,

  'src/routes/health.routes.ts.template': `import { Router } from 'express';
import { healthCheck } from '../controllers/health.controller.js';

const router = Router();

router.get('/', healthCheck);

export default router;`,

  'src/controllers/health.controller.ts.template': `import { Request, Response } from 'express';
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
});`,

  'src/utils/response.ts.template': `import { Response } from 'express';

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
}`,

  'src/types/index.ts.template': `export interface ApiResponse<T = any> {
  status: 'success' | 'error';
  message?: string;
  data?: T;
}`,

  'src/types/express.d.ts.template': `import { Express } from 'express';
{{#if includeAuth}}

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
      };
    }
  }
}
{{/if}}

export {};`,
};

// Database templates
const databaseTemplates = {
  'src/config/database.config.ts.template': `export const databaseConfig = {
  {{#if hasPostgres}}
  postgres: {
    url: process.env.DATABASE_URL || 'postgresql://localhost:5432/{{name}}',
  },
  {{/if}}
  {{#if hasMySQL}}
  mysql: {
    url: process.env.DATABASE_URL || 'mysql://localhost:3306/{{name}}',
  },
  {{/if}}
  {{#if hasMongoDB}}
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/{{name}}',
  },
  {{/if}}
  {{#if hasRedis}}
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },
  {{/if}}
};`,

  'src/database/connection.ts.template': `{{#if hasPostgres}}
import { Pool } from 'pg';
import { databaseConfig } from '../config/database.config.js';
{{#if includeLogging}}
import { logger } from '../utils/logger.js';
{{/if}}

export const pool = new Pool({
  connectionString: databaseConfig.postgres.url,
});

export async function connectDatabase() {
  try {
    await pool.query('SELECT NOW()');
    {{#if includeLogging}}
    logger.info('PostgreSQL database connected');
    {{else}}
    console.log('PostgreSQL database connected');
    {{/if}}
  } catch (error) {
    {{#if includeLogging}}
    logger.error('Failed to connect to database:', error);
    {{else}}
    console.error('Failed to connect to database:', error);
    {{/if}}
    process.exit(1);
  }
}
{{else if hasMySQL}}
import mysql from 'mysql2/promise';
import { databaseConfig } from '../config/database.config.js';

export let connection: mysql.Connection;

export async function connectDatabase() {
  try {
    connection = await mysql.createConnection(databaseConfig.mysql.url);
    console.log('MySQL database connected');
  } catch (error) {
    console.error('Failed to connect to database:', error);
    process.exit(1);
  }
}
{{else if hasMongoDB}}
import mongoose from 'mongoose';
import { databaseConfig } from '../config/database.config.js';

export async function connectDatabase() {
  try {
    await mongoose.connect(databaseConfig.mongodb.uri);
    console.log('MongoDB database connected');
  } catch (error) {
    console.error('Failed to connect to database:', error);
    process.exit(1);
  }
}
{{else}}
export async function connectDatabase() {
  // No database configured
}
{{/if}}`,

  'src/models/user.model.ts.template': `{{#if hasMongoDB}}
import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

export const User = mongoose.model('User', userSchema);
{{else}}
export interface User {
  id: string;
  email: string;
  password: string;
  name: string;
  createdAt: Date;
}
{{/if}}`,

  'src/repositories/user.repository.ts.template': `{{#if hasPostgres}}
import { pool } from '../database/connection.js';
import { User } from '../models/user.model.js';

export class UserRepository {
  async findByEmail(email: string): Promise<User | null> {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    return result.rows[0] || null;
  }

  async create(user: Omit<User, 'id' | 'createdAt'>): Promise<User> {
    const result = await pool.query(
      'INSERT INTO users (email, password, name) VALUES ($1, $2, $3) RETURNING *',
      [user.email, user.password, user.name]
    );
    return result.rows[0];
  }
}

export const userRepository = new UserRepository();
{{else}}
export class UserRepository {
  // Implement your repository methods here
}
{{/if}}`,
};

// Auth templates
const authTemplates = {
  'src/middleware/auth.middleware.ts.template': `import { Request, Response, NextFunction } from 'express';
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
}`,

  'src/utils/jwt.ts.template': `import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export function generateToken(payload: any): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyToken(token: string): any {
  return jwt.verify(token, JWT_SECRET);
}`,

  'src/controllers/user.controller.ts.template': `import { Request, Response } from 'express';
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
});`,

  'src/services/user.service.ts.template': `import bcrypt from 'bcryptjs';
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

export const userService = new UserService();`,

  'src/routes/user.routes.ts.template': `import { Router } from 'express';
import { register, login } from '../controllers/user.controller.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);

export default router;`,
};

// Logging templates
const loggingTemplates = {
  'src/utils/logger.ts.template': `{{#eq loggingLibrary "winston"}}
import winston from 'winston';

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple(),
  }));
}
{{else}}
import pino from 'pino';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
    },
  },
});
{{/eq}}`,
};

// Swagger templates
const swaggerTemplates = {
  'src/config/swagger.ts.template': `import { Application } from 'express';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: '{{name}} API',
      version: '1.0.0',
      description: '{{#if description}}{{description}}{{else}}API documentation{{/if}}',
    },
    servers: [
      {
        url: 'http://localhost:3000/api/v1',
        description: 'Development server',
      },
    ],
  },
  apis: ['./src/routes/*.ts'],
};

const specs = swaggerJsdoc(options);

export function setupSwagger(app: Application) {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));
}`,
};

// Docker templates
const dockerTemplates = {
  'docker/Dockerfile.template': `FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]`,

  'docker/docker-compose.yml.template': `version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    env_file:
      - .env
    depends_on:
{{#if hasPostgres}}
      - postgres
{{/if}}
{{#if hasMySQL}}
      - mysql
{{/if}}
{{#if hasMongoDB}}
      - mongodb
{{/if}}
{{#if hasRedis}}
      - redis
{{/if}}

{{#if hasPostgres}}
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: {{name}}
      POSTGRES_USER: user
      POSTGRES_PASSWORD: password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
{{/if}}

{{#if hasMySQL}}
  mysql:
    image: mysql:8
    environment:
      MYSQL_DATABASE: {{name}}
      MYSQL_USER: user
      MYSQL_PASSWORD: password
      MYSQL_ROOT_PASSWORD: rootpassword
    ports:
      - "3306:3306"
    volumes:
      - mysql_data:/var/lib/mysql
{{/if}}

{{#if hasMongoDB}}
  mongodb:
    image: mongo:7
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db
{{/if}}

{{#if hasRedis}}
  redis:
    image: redis:alpine
    ports:
      - "6379:6379"
{{/if}}

volumes:
{{#if hasPostgres}}
  postgres_data:
{{/if}}
{{#if hasMySQL}}
  mysql_data:
{{/if}}
{{#if hasMongoDB}}
  mongodb_data:
{{/if}}`,
};

// CI templates
const ciTemplates = {
  '.github/workflows/ci.yml.template': `name: CI

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: {{packageManager}} install
        
      - name: Lint
        run: {{packageManager}} run lint
        
      {{#if includeTesting}}
      - name: Run tests
        run: {{packageManager}} test
      {{/if}}
        
      - name: Build
        run: {{packageManager}} run build`,
};

// Test templates
const testTemplates = {
  'tests/setup.ts.template': `import dotenv from 'dotenv';

dotenv.config({ path: '.env.test' });

// Test setup code here`,

  'tests/integration/health.test.ts.template': `import request from 'supertest';
import { createApp } from '../../src/app';

describe('Health Check', () => {
  const app = createApp();

  it('should return health status', async () => {
    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
  });
});`,

  'tests/unit/utils.test.ts.template': `import { ApiResponse } from '../../src/utils/response';

describe('ApiResponse', () => {
  it('should create success response', () => {
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as any;

    ApiResponse.success(mockRes, { test: 'data' }, 'Success', 200);

    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith({
      status: 'success',
      message: 'Success',
      data: { test: 'data' },
    });
  });
});`,
};

// Combine all templates
const allTemplates = {
  ...templates,
  ...databaseTemplates,
  ...authTemplates,
  ...loggingTemplates,
  ...swaggerTemplates,
  ...dockerTemplates,
  ...ciTemplates,
  ...testTemplates,
};

// Write all templates
async function writeTemplates() {
  for (const [filePath, content] of Object.entries(allTemplates)) {
    const fullPath = path.join(templatesDir, filePath);
    const dir = path.dirname(fullPath);
    
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(fullPath, content, 'utf-8');
    console.log(`Created: ${filePath}`);
  }
  
  console.log(`\n✓ Created ${Object.keys(allTemplates).length} template files`);
}

writeTemplates().catch(console.error);
