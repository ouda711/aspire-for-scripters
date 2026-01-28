import { Server } from 'http';
import { createApp } from './app.js';
import { connectDatabase } from './database/connection.js';

/**
 * Create and configure HTTP server
 */
export async function createServer(): Promise<Server> {
  // Try to connect to database (optional for demo)
  try {
    await connectDatabase();
    console.log('✅ Database connected');
  } catch (error) {
    console.warn('⚠️  Database connection failed (running without database):', (error as Error).message);
  }

  const app = createApp();
  
  return app as any as Server;
}