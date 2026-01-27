import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import { load } from 'js-yaml';
import { DockerComposeGenerator } from '../../../src/generators/docker-compose-generator.js';
import type { ProjectConfig } from '../../../src/config/schema.js';

describe('DockerComposeGenerator', () => {
  const testDir = path.join(process.cwd(), 'test-output', 'docker-compose');

  beforeEach(async () => {
    await fs.ensureDir(testDir);
  });

  afterEach(async () => {
    await fs.remove(testDir);
  });

  describe('generate', () => {
    it('should generate docker-compose.yml for minimal config', async () => {
      const config = {
        name: 'test-app',
        framework: 'express',
      } as ProjectConfig;

      const generator = new DockerComposeGenerator(config, testDir);
      await generator.generate();

      const composeFile = path.join(testDir, 'docker-compose.yml');
      expect(await fs.pathExists(composeFile)).toBe(true);

      const content = await fs.readFile(composeFile, 'utf-8');
      const compose = load(content) as any;

      expect(compose.version).toBe('3.8');
      expect(compose.services).toHaveProperty('test-app');
      expect(compose.networks).toHaveProperty('app-network');
    });

    it('should generate docker-compose.yml with PostgreSQL', async () => {
      const config = {
        name: 'test-app',
        framework: 'express',
        sqlDatabase: 'postgresql',
      } as ProjectConfig;

      const generator = new DockerComposeGenerator(config, testDir);
      await generator.generate();

      const composeFile = path.join(testDir, 'docker-compose.yml');
      const content = await fs.readFile(composeFile, 'utf-8');
      const compose = load(content) as any;

      expect(compose.services).toHaveProperty('test-app');
      expect(compose.services).toHaveProperty('postgres');
      expect(compose.services['test-app'].depends_on).toHaveProperty('postgres');
      expect(compose.volumes).toHaveProperty('postgres_data');
    });

    it('should generate docker-compose.yml with all services', async () => {
      const config = {
        name: 'test-app',
        framework: 'express',
        sqlDatabase: 'postgresql',
        nosqlDatabases: ['redis', 'mongodb'],
        includeMessageQueue: true,
        messageQueue: 'rabbitmq',
      } as ProjectConfig;

      const generator = new DockerComposeGenerator(config, testDir);
      await generator.generate();

      const composeFile = path.join(testDir, 'docker-compose.yml');
      const content = await fs.readFile(composeFile, 'utf-8');
      const compose = load(content) as any;

      expect(compose.services).toHaveProperty('test-app');
      expect(compose.services).toHaveProperty('postgres');
      expect(compose.services).toHaveProperty('redis');
      expect(compose.services).toHaveProperty('mongodb');
      expect(compose.services).toHaveProperty('rabbitmq');

      expect(compose.volumes).toHaveProperty('postgres_data');
      expect(compose.volumes).toHaveProperty('redis_data');
      expect(compose.volumes).toHaveProperty('mongodb_data');
      expect(compose.volumes).toHaveProperty('rabbitmq_data');
    });

    it('should generate .env file', async () => {
      const config = {
        name: 'test-app',
        framework: 'express',
        sqlDatabase: 'postgresql',
      } as ProjectConfig;

      const generator = new DockerComposeGenerator(config, testDir);
      await generator.generate();

      const envFile = path.join(testDir, '.env');
      expect(await fs.pathExists(envFile)).toBe(true);

      const content = await fs.readFile(envFile, 'utf-8');
      expect(content).toContain('NODE_ENV=development');
      expect(content).toContain('PORT=3000');
      expect(content).toContain('POSTGRES_HOST=postgres');
      expect(content).toContain('POSTGRES_PORT=5432');
    });

    it('should generate .dockerignore file', async () => {
      const config = {
        name: 'test-app',
        framework: 'express',
      } as ProjectConfig;

      const generator = new DockerComposeGenerator(config, testDir);
      await generator.generate();

      const dockerignoreFile = path.join(testDir, '.dockerignore');
      expect(await fs.pathExists(dockerignoreFile)).toBe(true);

      const content = await fs.readFile(dockerignoreFile, 'utf-8');
      expect(content).toContain('node_modules');
      expect(content).toContain('.git');
      expect(content).toContain('.env');
    });

    it('should handle MySQL database', async () => {
      const config = {
        name: 'test-app',
        framework: 'express',
        sqlDatabase: 'mysql',
      } as ProjectConfig;

      const generator = new DockerComposeGenerator(config, testDir);
      await generator.generate();

      const composeFile = path.join(testDir, 'docker-compose.yml');
      const content = await fs.readFile(composeFile, 'utf-8');
      const compose = load(content) as any;

      expect(compose.services).toHaveProperty('mysql');
      expect(compose.volumes).toHaveProperty('mysql_data');

      const envFile = path.join(testDir, '.env');
      const envContent = await fs.readFile(envFile, 'utf-8');
      expect(envContent).toContain('MYSQL_HOST=mysql');
    });

    it('should order services by dependencies', async () => {
      const config = {
        name: 'test-app',
        framework: 'express',
        sqlDatabase: 'postgresql',
        nosqlDatabases: ['redis'],
      } as ProjectConfig;

      const generator = new DockerComposeGenerator(config, testDir);
      await generator.generate();

      const composeFile = path.join(testDir, 'docker-compose.yml');
      const content = await fs.readFile(composeFile, 'utf-8');
      const compose = load(content) as any;

      const serviceNames = Object.keys(compose.services);
      const appIndex = serviceNames.indexOf('test-app');
      const postgresIndex = serviceNames.indexOf('postgres');
      const redisIndex = serviceNames.indexOf('redis');

      // Dependencies should come before the app
      expect(postgresIndex).toBeLessThan(appIndex);
      expect(redisIndex).toBeLessThan(appIndex);
    });
  });
});
