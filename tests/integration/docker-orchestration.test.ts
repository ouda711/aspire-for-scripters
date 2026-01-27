import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import { load } from 'js-yaml';
import { DockerComposeGenerator } from '../../src/generators/docker-compose-generator.js';
import { ServiceRegistry } from '../../src/orchestration/service-registry.js';
import { DependencyResolver } from '../../src/orchestration/dependency-resolver.js';
import type { ProjectConfig } from '../../src/config/schema.js';

describe('Docker Orchestration Integration', () => {
  const testDir = path.join(process.cwd(), 'test-output', 'integration');

  beforeEach(async () => {
    await fs.ensureDir(testDir);
  });

  afterEach(async () => {
    await fs.remove(testDir);
  });

  it('should generate complete Docker setup for full-stack application', async () => {
    const config = {
      name: 'full-stack-app',
      framework: 'nestjs',
      sqlDatabase: 'postgresql',
      nosqlDatabases: ['redis', 'mongodb'],
      includeMessageQueue: true,
      messageQueue: 'rabbitmq',
    } as ProjectConfig;

    // Step 1: Get all services
    const services = ServiceRegistry.getServices(config);
    expect(services).toHaveLength(5);

    // Step 2: Validate dependencies
    expect(() => DependencyResolver.validateDependencies(services)).not.toThrow();

    // Step 3: Sort by dependencies
    const sorted = DependencyResolver.sortByDependencies(services);
    expect(sorted).toHaveLength(5);

    // Find app and dependency positions
    const appIndex = sorted.findIndex(s => s.name === 'full-stack-app');
    const postgresIndex = sorted.findIndex(s => s.name === 'postgres');
    const redisIndex = sorted.findIndex(s => s.name === 'redis');
    const mongodbIndex = sorted.findIndex(s => s.name === 'mongodb');

    // App should come after its dependencies
    expect(appIndex).toBeGreaterThan(postgresIndex);
    expect(appIndex).toBeGreaterThan(redisIndex);
    expect(appIndex).toBeGreaterThan(mongodbIndex);

    // Step 4: Generate Docker Compose files
    const generator = new DockerComposeGenerator(config, testDir);
    await generator.generate();

    // Step 5: Verify docker-compose.yml
    const composeFile = path.join(testDir, 'docker-compose.yml');
    expect(await fs.pathExists(composeFile)).toBe(true);

    const composeContent = await fs.readFile(composeFile, 'utf-8');
    const compose = load(composeContent) as any;

    expect(compose.version).toBe('3.8');
    expect(Object.keys(compose.services)).toHaveLength(5);
    expect(compose.services['full-stack-app'].depends_on).toHaveProperty('postgres');
    expect(compose.services['full-stack-app'].depends_on).toHaveProperty('redis');
    expect(compose.services['full-stack-app'].depends_on).toHaveProperty('mongodb');

    // Step 6: Verify .env file
    const envFile = path.join(testDir, '.env');
    expect(await fs.pathExists(envFile)).toBe(true);

    const envContent = await fs.readFile(envFile, 'utf-8');
    expect(envContent).toContain('NODE_ENV=development');
    expect(envContent).toContain('POSTGRES_HOST=postgres');
    expect(envContent).toContain('REDIS_HOST=redis');
    expect(envContent).toContain('MONGODB_URI');
    expect(envContent).toContain('RABBITMQ_HOST=rabbitmq');

    // Step 7: Verify .dockerignore file
    const dockerignoreFile = path.join(testDir, '.dockerignore');
    expect(await fs.pathExists(dockerignoreFile)).toBe(true);

    // Step 8: Verify health checks are present
    expect(compose.services['full-stack-app'].healthcheck).toBeDefined();
    expect(compose.services['postgres'].healthcheck).toBeDefined();
    expect(compose.services['redis'].healthcheck).toBeDefined();
    expect(compose.services['rabbitmq'].healthcheck).toBeDefined();

    // Step 9: Verify networks
    expect(compose.networks).toHaveProperty('app-network');

    // Step 10: Verify volumes
    expect(compose.volumes).toHaveProperty('postgres_data');
    expect(compose.volumes).toHaveProperty('redis_data');
    expect(compose.volumes).toHaveProperty('mongodb_data');
    expect(compose.volumes).toHaveProperty('rabbitmq_data');
  });
});
