/**
 * Core type definitions for Aspire for Scripters
 */

export type Framework = 'express' | 'nestjs';

export type Database = 'postgresql' | 'mysql' | 'mongodb' | 'redis' | 'sqlite';

export type Frontend = 'react' | 'nextjs' | 'vue' | 'angular' | 'none';

export interface ProjectConfig {
  name: string;
  framework: Framework;
  databases: Database[];
  frontend: Frontend;
  includeDocker: boolean;
  includeKubernetes: boolean;
  includeTesting: boolean;
  includeCI: boolean;
}

export interface ServiceConfig {
  name: string;
  port: number;
  dependencies: string[];
  healthCheck?: string;
}
