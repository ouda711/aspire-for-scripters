/**
 * Service information
 */
export interface ServiceInfo {
  name: string;
  type: 'app' | 'database' | 'cache' | 'queue' | 'other';
  status: ServiceStatus;
  port?: number;
  url?: string;
  pid?: number;
  startTime: string;
  lastUpdate: string;
  metrics?: ServiceMetrics;
  logs?: LogEntry[];
  environment?: Record<string, string>;
}

/**
 * Service status
 */
export type ServiceStatus = 'starting' | 'running' | 'stopped' | 'error';

/**
 * Service metrics
 */
export interface ServiceMetrics {
  cpu?: number;
  memory?: number;
  requests?: number;
  errors?: number;
  uptime?: number;
}

/**
 * Log entry
 */
export interface LogEntry {
  timestamp: string;
  message: string;
  level?: 'info' | 'warn' | 'error' | 'debug';
}
