import { Pool } from 'pg';
import { databaseConfig } from '../config/database.config.js';

export const pool = new Pool({
  connectionString: databaseConfig.postgres.url,
});

export async function connectDatabase() {
  try {
    await pool.query('SELECT NOW()');
    console.log('PostgreSQL database connected');
  } catch (error) {
    console.error('Failed to connect to database:', error);
    throw error; // Throw instead of exit, let caller handle it
  }
}
