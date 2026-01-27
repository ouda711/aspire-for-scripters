import type { ProjectConfig } from '../config/schema.js';

/**
 * Service definition for Docker Compose
 */
export interface ServiceDefinition {
  name: string;
  image?: string;
  build?: {
    context: string;
    dockerfile: string;
  };
  ports?: string[];
  environment?: Record<string, string>;
  volumes?: string[];
  depends_on?: Record<string, { condition: string }>;
  healthcheck?: {
    test: string[];
    interval: string;
    timeout: string;
    retries: number;
    start_period?: string;
  };
  networks?: string[];
  restart?: string;
  command?: string;
}

/**
 * Service registry that defines all available services
 */
export class ServiceRegistry {
  /**
   * Get application service definition
   */
  static getAppService(config: ProjectConfig): ServiceDefinition {
    const service: ServiceDefinition = {
      name: config.name,
      build: {
        context: '.',
        dockerfile: 'Dockerfile',
      },
      ports: ['${PORT:-3000}:${PORT:-3000}'],
      environment: {
        NODE_ENV: '${NODE_ENV:-development}',
        PORT: '${PORT:-3000}',
      },
      volumes: ['.:/app', '/app/node_modules'],
      depends_on: {},
      healthcheck: {
        test: ['CMD', 'curl', '-f', 'http://localhost:${PORT:-3000}/health'],
        interval: '30s',
        timeout: '10s',
        retries: 3,
        start_period: '40s',
      },
      networks: ['app-network'],
      restart: 'unless-stopped',
    };

    // Add database dependencies
    if (config.sqlDatabase) {
      const dbService = this.getDatabaseServiceName(config.sqlDatabase);
      service.depends_on![dbService] = { condition: 'service_healthy' };

      // Add database connection environment variables
      this.addDatabaseEnvVars(service, config.sqlDatabase);
    }

    // Add Redis dependency
    if (config.nosqlDatabases?.includes('redis')) {
      service.depends_on!['redis'] = { condition: 'service_healthy' };
      service.environment!['REDIS_HOST'] = 'redis';
      service.environment!['REDIS_PORT'] = '6379';
    }

    // Add MongoDB dependency
    if (config.nosqlDatabases?.includes('mongodb')) {
      service.depends_on!['mongodb'] = { condition: 'service_started' };
      service.environment!['MONGODB_URI'] = 'mongodb://mongodb:27017/${DB_NAME:-myapp}';
    }

    return service;
  }

  /**
   * Get PostgreSQL service definition
   */
  static getPostgreSQLService(): ServiceDefinition {
    return {
      name: 'postgres',
      image: 'postgres:16-alpine',
      ports: ['${POSTGRES_PORT:-5432}:5432'],
      environment: {
        POSTGRES_USER: '${POSTGRES_USER:-postgres}',
        POSTGRES_PASSWORD: '${POSTGRES_PASSWORD:-postgres}',
        POSTGRES_DB: '${POSTGRES_DB:-myapp}',
        PGDATA: '/var/lib/postgresql/data/pgdata',
      },
      volumes: ['postgres_data:/var/lib/postgresql/data'],
      healthcheck: {
        test: ['CMD-SHELL', 'pg_isready -U ${POSTGRES_USER:-postgres}'],
        interval: '10s',
        timeout: '5s',
        retries: 5,
      },
      networks: ['app-network'],
      restart: 'unless-stopped',
    };
  }

  /**
   * Get MySQL service definition
   */
  static getMySQLService(): ServiceDefinition {
    return {
      name: 'mysql',
      image: 'mysql:8.0',
      ports: ['${MYSQL_PORT:-3306}:3306'],
      environment: {
        MYSQL_ROOT_PASSWORD: '${MYSQL_ROOT_PASSWORD:-root}',
        MYSQL_DATABASE: '${MYSQL_DATABASE:-myapp}',
        MYSQL_USER: '${MYSQL_USER:-user}',
        MYSQL_PASSWORD: '${MYSQL_PASSWORD:-password}',
      },
      volumes: ['mysql_data:/var/lib/mysql'],
      healthcheck: {
        test: ['CMD', 'mysqladmin', 'ping', '-h', 'localhost'],
        interval: '10s',
        timeout: '5s',
        retries: 5,
      },
      networks: ['app-network'],
      restart: 'unless-stopped',
      command: '--default-authentication-plugin=mysql_native_password',
    };
  }

  /**
   * Get MongoDB service definition
   */
  static getMongoDBService(): ServiceDefinition {
    return {
      name: 'mongodb',
      image: 'mongo:7.0',
      ports: ['${MONGODB_PORT:-27017}:27017'],
      environment: {
        MONGO_INITDB_ROOT_USERNAME: '${MONGODB_USER:-admin}',
        MONGO_INITDB_ROOT_PASSWORD: '${MONGODB_PASSWORD:-password}',
      },
      volumes: ['mongodb_data:/data/db'],
      networks: ['app-network'],
      restart: 'unless-stopped',
    };
  }

  /**
   * Get Redis service definition
   */
  static getRedisService(): ServiceDefinition {
    return {
      name: 'redis',
      image: 'redis:7-alpine',
      ports: ['${REDIS_PORT:-6379}:6379'],
      volumes: ['redis_data:/data'],
      healthcheck: {
        test: ['CMD', 'redis-cli', 'ping'],
        interval: '10s',
        timeout: '5s',
        retries: 5,
      },
      networks: ['app-network'],
      restart: 'unless-stopped',
      command: 'redis-server --appendonly yes',
    };
  }

  /**
   * Get RabbitMQ service definition
   */
  static getRabbitMQService(): ServiceDefinition {
    return {
      name: 'rabbitmq',
      image: 'rabbitmq:3-management-alpine',
      ports: ['${RABBITMQ_PORT:-5672}:5672', '${RABBITMQ_MANAGEMENT_PORT:-15672}:15672'],
      environment: {
        RABBITMQ_DEFAULT_USER: '${RABBITMQ_USER:-guest}',
        RABBITMQ_DEFAULT_PASS: '${RABBITMQ_PASSWORD:-guest}',
      },
      volumes: ['rabbitmq_data:/var/lib/rabbitmq'],
      healthcheck: {
        test: ['CMD', 'rabbitmq-diagnostics', '-q', 'ping'],
        interval: '30s',
        timeout: '10s',
        retries: 3,
      },
      networks: ['app-network'],
      restart: 'unless-stopped',
    };
  }

  /**
   * Get all services for a configuration
   */
  static getServices(config: ProjectConfig): ServiceDefinition[] {
    const services: ServiceDefinition[] = [];

    // Always add app service
    services.push(this.getAppService(config));

    // Add database services
    if (config.sqlDatabase === 'postgresql') {
      services.push(this.getPostgreSQLService());
    } else if (config.sqlDatabase === 'mysql') {
      services.push(this.getMySQLService());
    }

    // Add NoSQL services
    if (config.nosqlDatabases?.includes('mongodb')) {
      services.push(this.getMongoDBService());
    }
    if (config.nosqlDatabases?.includes('redis')) {
      services.push(this.getRedisService());
    }

    // Add message queue
    if (config.includeMessageQueue && config.messageQueue === 'rabbitmq') {
      services.push(this.getRabbitMQService());
    }

    return services;
  }

  /**
   * Helper: Get database service name
   */
  private static getDatabaseServiceName(database: string): string {
    const map: Record<string, string> = {
      postgresql: 'postgres',
      mysql: 'mysql',
      sqlite: '', // SQLite doesn't need a service
    };
    return map[database] || database;
  }

  /**
   * Helper: Add database environment variables
   */
  private static addDatabaseEnvVars(service: ServiceDefinition, database: string): void {
    if (database === 'postgresql') {
      service.environment!['POSTGRES_HOST'] = 'postgres';
      service.environment!['POSTGRES_PORT'] = '5432';
      service.environment!['POSTGRES_USER'] = '${POSTGRES_USER:-postgres}';
      service.environment!['POSTGRES_PASSWORD'] = '${POSTGRES_PASSWORD:-postgres}';
      service.environment!['POSTGRES_DB'] = '${POSTGRES_DB:-myapp}';
    } else if (database === 'mysql') {
      service.environment!['MYSQL_HOST'] = 'mysql';
      service.environment!['MYSQL_PORT'] = '3306';
      service.environment!['MYSQL_USER'] = '${MYSQL_USER:-user}';
      service.environment!['MYSQL_PASSWORD'] = '${MYSQL_PASSWORD:-password}';
      service.environment!['MYSQL_DATABASE'] = '${MYSQL_DATABASE:-myapp}';
    }
  }
}
