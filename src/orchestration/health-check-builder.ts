/**
 * Health check configuration
 */
export interface HealthCheckConfig {
  test: string[];
  interval: string;
  timeout: string;
  retries: number;
  start_period?: string;
}

/**
 * Health check builder for different service types
 */
export class HealthCheckBuilder {
  /**
   * Create HTTP health check
   */
  static http(
    port: number | string,
    path: string = '/health',
    options: Partial<HealthCheckConfig> = {},
  ): HealthCheckConfig {
    return {
      test: ['CMD', 'curl', '-f', `http://localhost:${port}${path}`],
      interval: options.interval || '30s',
      timeout: options.timeout || '10s',
      retries: options.retries || 3,
      start_period: options.start_period || '40s',
    };
  }

  /**
   * Create PostgreSQL health check
   */
  static postgres(user: string = 'postgres', options: Partial<HealthCheckConfig> = {}): HealthCheckConfig {
    return {
      test: ['CMD-SHELL', `pg_isready -U ${user}`],
      interval: options.interval || '10s',
      timeout: options.timeout || '5s',
      retries: options.retries || 5,
    };
  }

  /**
   * Create MySQL health check
   */
  static mysql(options: Partial<HealthCheckConfig> = {}): HealthCheckConfig {
    return {
      test: ['CMD', 'mysqladmin', 'ping', '-h', 'localhost'],
      interval: options.interval || '10s',
      timeout: options.timeout || '5s',
      retries: options.retries || 5,
    };
  }

  /**
   * Create Redis health check
   */
  static redis(options: Partial<HealthCheckConfig> = {}): HealthCheckConfig {
    return {
      test: ['CMD', 'redis-cli', 'ping'],
      interval: options.interval || '10s',
      timeout: options.timeout || '5s',
      retries: options.retries || 5,
    };
  }

  /**
   * Create RabbitMQ health check
   */
  static rabbitmq(options: Partial<HealthCheckConfig> = {}): HealthCheckConfig {
    return {
      test: ['CMD', 'rabbitmq-diagnostics', '-q', 'ping'],
      interval: options.interval || '30s',
      timeout: options.timeout || '10s',
      retries: options.retries || 3,
    };
  }

  /**
   * Create custom health check from command
   */
  static custom(
    command: string[],
    options: Partial<HealthCheckConfig> = {},
  ): HealthCheckConfig {
    return {
      test: command,
      interval: options.interval || '30s',
      timeout: options.timeout || '10s',
      retries: options.retries || 3,
      start_period: options.start_period,
    };
  }
}
