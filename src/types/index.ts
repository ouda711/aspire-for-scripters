/**
 * Core type definitions for Aspire for Scripters
 * Re-export types from config/schema for backward compatibility
 */

export type {
  ProjectConfig,
} from '../config/schema.js';

export type Framework = 'express' | 'nestjs';

export type SQLDatabase = 'postgresql' | 'mysql' | 'sqlite';
export type NoSQLDatabase = 'mongodb' | 'redis';
export type Database = SQLDatabase | NoSQLDatabase;

export type Frontend = 'react' | 'nextjs' | 'vue' | 'angular' | 'none';

export type PackageManager = 'npm' | 'yarn' | 'pnpm';

export interface PromptAnswers extends Omit<import('../config/schema.js').ProjectConfig, 'name' | 'sqlDatabase'> {
  projectName: string;
  sqlDatabase?: SQLDatabase | 'none';
}

export interface ServiceConfig {
  name: string;
  port: number;
  dependencies: string[];
  healthCheck?: string;
}
