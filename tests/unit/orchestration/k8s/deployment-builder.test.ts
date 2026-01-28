import { describe, it, expect } from 'vitest';
import { DeploymentBuilder } from '../../../../src/orchestration/k8s/deployment-builder.js';
import type { ProjectConfig } from '../../../../src/config/schema.js';

describe('DeploymentBuilder', () => {
  describe('createAppDeployment', () => {
    it('should create basic app deployment', () => {
      const config = {
        name: 'test-app',
        framework: 'express',
        nosqlDatabases: [],
      } as ProjectConfig;

      const deployment = DeploymentBuilder.createAppDeployment(config);

      expect(deployment.apiVersion).toBe('apps/v1');
      expect(deployment.kind).toBe('Deployment');
      expect(deployment.metadata.name).toBe('test-app');
      expect(deployment.spec.replicas).toBe(3);
    });

    it('should include resource limits', () => {
      const config = {
        name: 'test-app',
        framework: 'nestjs',
        nosqlDatabases: [],
      } as ProjectConfig;

      const deployment = DeploymentBuilder.createAppDeployment(config);
      const container = deployment.spec.template.spec.containers[0];

      expect(container.resources?.requests.cpu).toBe('100m');
      expect(container.resources?.requests.memory).toBe('128Mi');
      expect(container.resources?.limits.cpu).toBe('500m');
      expect(container.resources?.limits.memory).toBe('512Mi');
    });

    it('should include health probes', () => {
      const config = {
        name: 'test-app',
        framework: 'express',
        nosqlDatabases: [],
      } as ProjectConfig;

      const deployment = DeploymentBuilder.createAppDeployment(config);
      const container = deployment.spec.template.spec.containers[0];

      expect(container.livenessProbe?.httpGet.path).toBe('/health');
      expect(container.readinessProbe?.httpGet.path).toBe('/health');
    });
  });

  describe('createDatabaseDeployment', () => {
    it('should create database deployment', () => {
      const deployment = DeploymentBuilder.createDatabaseDeployment(
        'postgres',
        'postgres:16-alpine',
        5432,
        { app: 'postgres' }
      );

      expect(deployment.kind).toBe('Deployment');
      expect(deployment.metadata.name).toBe('postgres');
      expect(deployment.spec.replicas).toBe(1);
      expect(deployment.spec.template.spec.containers[0].image).toBe('postgres:16-alpine');
    });
  });
});
