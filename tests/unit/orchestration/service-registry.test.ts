import { describe, it, expect } from 'vitest';
import { ServiceRegistry } from '../../../src/orchestration/service-registry.js';
import type { ProjectConfig } from '../../../src/config/schema.js';

describe('ServiceRegistry', () => {
  describe('getAppService', () => {
    it('should create basic app service', () => {
      const config = {
        name: 'test-app',
        framework: 'express',
      } as ProjectConfig;

      const service = ServiceRegistry.getAppService(config);

      expect(service.name).toBe('test-app');
      expect(service.build).toEqual({ context: '.', dockerfile: 'Dockerfile' });
      expect(service.ports).toEqual(['${PORT:-3000}:${PORT:-3000}']);
      expect(service.healthcheck).toBeDefined();
      expect(service.networks).toEqual(['app-network']);
      expect(service.restart).toBe('unless-stopped');
    });

    it('should add PostgreSQL dependency', () => {
      const config = {
        name: 'test-app',
        framework: 'express',
        sqlDatabase: 'postgresql',
      } as ProjectConfig;

      const service = ServiceRegistry.getAppService(config);

      expect(service.depends_on).toHaveProperty('postgres');
      expect(service.depends_on!['postgres']).toEqual({ condition: 'service_healthy' });
      expect(service.environment!['POSTGRES_HOST']).toBe('postgres');
      expect(service.environment!['POSTGRES_PORT']).toBe('5432');
    });

    it('should add MySQL dependency', () => {
      const config = {
        name: 'test-app',
        framework: 'express',
        sqlDatabase: 'mysql',
      } as ProjectConfig;

      const service = ServiceRegistry.getAppService(config);

      expect(service.depends_on).toHaveProperty('mysql');
      expect(service.depends_on!['mysql']).toEqual({ condition: 'service_healthy' });
      expect(service.environment!['MYSQL_HOST']).toBe('mysql');
      expect(service.environment!['MYSQL_PORT']).toBe('3306');
    });

    it('should add Redis dependency', () => {
      const config = {
        name: 'test-app',
        framework: 'express',
        nosqlDatabases: ['redis'],
      } as ProjectConfig;

      const service = ServiceRegistry.getAppService(config);

      expect(service.depends_on).toHaveProperty('redis');
      expect(service.depends_on!['redis']).toEqual({ condition: 'service_healthy' });
      expect(service.environment!['REDIS_HOST']).toBe('redis');
      expect(service.environment!['REDIS_PORT']).toBe('6379');
    });

    it('should add MongoDB dependency', () => {
      const config = {
        name: 'test-app',
        framework: 'express',
        nosqlDatabases: ['mongodb'],
      } as ProjectConfig;

      const service = ServiceRegistry.getAppService(config);

      expect(service.depends_on).toHaveProperty('mongodb');
      expect(service.depends_on!['mongodb']).toEqual({ condition: 'service_started' });
      expect(service.environment!['MONGODB_URI']).toBe('mongodb://mongodb:27017/${DB_NAME:-myapp}');
    });
  });

  describe('getPostgreSQLService', () => {
    it('should create PostgreSQL service', () => {
      const service = ServiceRegistry.getPostgreSQLService();

      expect(service.name).toBe('postgres');
      expect(service.image).toBe('postgres:16-alpine');
      expect(service.ports).toEqual(['${POSTGRES_PORT:-5432}:5432']);
      expect(service.environment).toHaveProperty('POSTGRES_USER');
      expect(service.environment).toHaveProperty('POSTGRES_PASSWORD');
      expect(service.environment).toHaveProperty('POSTGRES_DB');
      expect(service.volumes).toContain('postgres_data:/var/lib/postgresql/data');
      expect(service.healthcheck).toBeDefined();
      expect(service.networks).toEqual(['app-network']);
    });
  });

  describe('getMySQLService', () => {
    it('should create MySQL service', () => {
      const service = ServiceRegistry.getMySQLService();

      expect(service.name).toBe('mysql');
      expect(service.image).toBe('mysql:8.0');
      expect(service.ports).toEqual(['${MYSQL_PORT:-3306}:3306']);
      expect(service.environment).toHaveProperty('MYSQL_ROOT_PASSWORD');
      expect(service.environment).toHaveProperty('MYSQL_DATABASE');
      expect(service.volumes).toContain('mysql_data:/var/lib/mysql');
      expect(service.healthcheck).toBeDefined();
      expect(service.command).toBe('--default-authentication-plugin=mysql_native_password');
    });
  });

  describe('getMongoDBService', () => {
    it('should create MongoDB service', () => {
      const service = ServiceRegistry.getMongoDBService();

      expect(service.name).toBe('mongodb');
      expect(service.image).toBe('mongo:7.0');
      expect(service.ports).toEqual(['${MONGODB_PORT:-27017}:27017']);
      expect(service.environment).toHaveProperty('MONGO_INITDB_ROOT_USERNAME');
      expect(service.environment).toHaveProperty('MONGO_INITDB_ROOT_PASSWORD');
      expect(service.volumes).toContain('mongodb_data:/data/db');
    });
  });

  describe('getRedisService', () => {
    it('should create Redis service', () => {
      const service = ServiceRegistry.getRedisService();

      expect(service.name).toBe('redis');
      expect(service.image).toBe('redis:7-alpine');
      expect(service.ports).toEqual(['${REDIS_PORT:-6379}:6379']);
      expect(service.volumes).toContain('redis_data:/data');
      expect(service.healthcheck).toBeDefined();
      expect(service.command).toBe('redis-server --appendonly yes');
    });
  });

  describe('getRabbitMQService', () => {
    it('should create RabbitMQ service', () => {
      const service = ServiceRegistry.getRabbitMQService();

      expect(service.name).toBe('rabbitmq');
      expect(service.image).toBe('rabbitmq:3-management-alpine');
      expect(service.ports).toHaveLength(2);
      expect(service.environment).toHaveProperty('RABBITMQ_DEFAULT_USER');
      expect(service.environment).toHaveProperty('RABBITMQ_DEFAULT_PASS');
      expect(service.volumes).toContain('rabbitmq_data:/var/lib/rabbitmq');
      expect(service.healthcheck).toBeDefined();
    });
  });

  describe('getServices', () => {
    it('should return only app service for minimal config', () => {
      const config = {
        name: 'test-app',
        framework: 'express',
      } as ProjectConfig;

      const services = ServiceRegistry.getServices(config);

      expect(services).toHaveLength(1);
      expect(services[0].name).toBe('test-app');
    });

    it('should return app and PostgreSQL services', () => {
      const config = {
        name: 'test-app',
        framework: 'express',
        sqlDatabase: 'postgresql',
      } as ProjectConfig;

      const services = ServiceRegistry.getServices(config);

      expect(services).toHaveLength(2);
      expect(services.map(s => s.name)).toContain('test-app');
      expect(services.map(s => s.name)).toContain('postgres');
    });

    it('should return all services for full config', () => {
      const config = {
        name: 'test-app',
        framework: 'express',
        sqlDatabase: 'postgresql',
        nosqlDatabases: ['redis', 'mongodb'],
        includeMessageQueue: true,
        messageQueue: 'rabbitmq',
      } as ProjectConfig;

      const services = ServiceRegistry.getServices(config);

      expect(services).toHaveLength(5);
      expect(services.map(s => s.name)).toEqual(
        expect.arrayContaining(['test-app', 'postgres', 'redis', 'mongodb', 'rabbitmq']),
      );
    });
  });
});
