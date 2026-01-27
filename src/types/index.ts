/**
 * Core type definitions for Aspire for Scripters
 */

export type Framework = 'express' | 'nestjs';

export type SQLDatabase = 'postgresql' | 'mysql' | 'sqlite';
export type NoSQLDatabase = 'mongodb' | 'redis';
export type Database = SQLDatabase | NoSQLDatabase;

export type Frontend = 'react' | 'nextjs' | 'vue' | 'angular' | 'none';

export type PackageManager = 'npm' | 'yarn' | 'pnpm';

export interface ProjectConfig {
  // Project basics
  name: string;
  description?: string;
  author?: string;
  packageManager: PackageManager;

  // Backend
  framework: Framework;
  includeAuth: boolean;
  includeSwagger: boolean;

  // Databases
  sqlDatabase?: SQLDatabase;
  nosqlDatabases: NoSQLDatabase[];

  // Frontend
  frontend: Frontend;
  monorepo: boolean; // true if frontend is included in same repo

  // Infrastructure
  includeDocker: boolean;
  includeKubernetes: boolean;
  includeMessageQueue: boolean;
  messageQueue?: 'rabbitmq' | 'bullmq';

  // Development tools
  includeTesting: boolean;
  includeCI: boolean;
  ciProvider?: 'github' | 'gitlab' | 'none';
  includeHusky: boolean;

  // Observability
  includeLogging: boolean;
  loggingLibrary?: 'winston' | 'pino';
  includeMetrics: boolean;
}

export interface PromptAnswers extends Omit<ProjectConfig, 'name'> {
  projectName: string;
}

export interface ServiceConfig {
  name: string;
  port: number;
  dependencies: string[];
  healthCheck?: string;
}
