import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'fs';
import { join } from 'path';
import * as yaml from 'js-yaml';
import { KubernetesGenerator } from '../../../src/generators/kubernetes-generator.js';
import type { ProjectConfig } from '../../../src/config/schema.js';

describe('KubernetesGenerator', () => {
  const testDir = join(process.cwd(), 'test-k8s-output');

  beforeEach(async () => {
    await fs.mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(testDir, { recursive: true, force: true });
  });

  it('should generate minimal kubernetes manifests', async () => {
    const config: ProjectConfig = {
      name: 'test-app',
      framework: 'express',
      projectPath: testDir,
      sqlDatabase: null,
      nosqlDatabases: [],
      includeAuth: false,
      includeDocker: false,
      includeKubernetes: true,
      includeTests: false,
      includeSwagger: false,
    };

    const generator = new KubernetesGenerator(config, testDir);
    await generator.generate();

    const k8sDir = join(testDir, 'k8s');
    const files = await fs.readdir(k8sDir);

    expect(files).toContain('deployment.yml');
    expect(files).toContain('service.yml');
    expect(files).toContain('configmap.yml');
    expect(files).toContain('secret.yml');
    expect(files).toContain('ingress.yml');
    expect(files).toContain('hpa.yml');
    expect(files).toContain('README.md');
  });

  it('should generate PostgreSQL resources', async () => {
    const config: ProjectConfig = {
      name: 'test-app',
      framework: 'express',
      projectPath: testDir,
      sqlDatabase: 'postgresql',
      nosqlDatabases: [],
      includeAuth: false,
      includeDocker: false,
      includeKubernetes: true,
      includeTests: false,
      includeSwagger: false,
    };

    const generator = new KubernetesGenerator(config, testDir);
    await generator.generate();

    const k8sDir = join(testDir, 'k8s');
    const files = await fs.readdir(k8sDir);

    expect(files).toContain('postgres-deployment.yml');
    expect(files).toContain('postgres-service.yml');
    expect(files).toContain('postgres-pvc.yml');
    expect(files).toContain('postgres-secret.yml');
  });

  it('should generate valid YAML', async () => {
    const config: ProjectConfig = {
      name: 'test-app',
      framework: 'express',
      projectPath: testDir,
      sqlDatabase: null,
      nosqlDatabases: [],
      includeAuth: false,
      includeDocker: false,
      includeKubernetes: true,
      includeTests: false,
      includeSwagger: false,
    };

    const generator = new KubernetesGenerator(config, testDir);
    await generator.generate();

    const deploymentPath = join(testDir, 'k8s', 'deployment.yml');
    const content = await fs.readFile(deploymentPath, 'utf-8');
    
    const parsed = yaml.load(content);
    expect(parsed).toBeDefined();
    expect((parsed as any).kind).toBe('Deployment');
  });
});
