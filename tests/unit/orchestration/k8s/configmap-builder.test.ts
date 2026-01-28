import { describe, it, expect } from 'vitest';
import { ConfigMapBuilder } from '../../../../src/orchestration/k8s/configmap-builder.js';
import type { ProjectConfig } from '../../../../src/config/schema.js';

describe('ConfigMapBuilder', () => {
  describe('createAppConfigMap', () => {
    it('should create basic app config', () => {
      const config = {
        name: 'test-app',
        nosqlDatabases: [],
      } as ProjectConfig;

      const configMap = ConfigMapBuilder.createAppConfigMap(config);

      expect(configMap.apiVersion).toBe('v1');
      expect(configMap.kind).toBe('ConfigMap');
      expect(configMap.metadata.name).toBe('test-app-config');
      expect(configMap.data['log-level']).toBe('info');
      expect(configMap.data['node-env']).toBe('production');
    });

    it('should include PostgreSQL configuration', () => {
      const config = {
        name: 'test-app',
        sqlDatabase: 'postgresql',
        nosqlDatabases: [],
      } as ProjectConfig;

      const configMap = ConfigMapBuilder.createAppConfigMap(config);

      expect(configMap.data['postgres-host']).toBe('postgres');
      expect(configMap.data['postgres-port']).toBe('5432');
      expect(configMap.data['postgres-database']).toBe('myapp');
    });

    it('should include Redis configuration', () => {
      const config = {
        name: 'test-app',
        nosqlDatabases: ['redis'],
      } as ProjectConfig;

      const configMap = ConfigMapBuilder.createAppConfigMap(config);

      expect(configMap.data['redis-host']).toBe('redis');
      expect(configMap.data['redis-port']).toBe('6379');
    });
  });

  describe('createDatabaseConfigMap', () => {
    it('should create PostgreSQL config', () => {
      const configMap = ConfigMapBuilder.createDatabaseConfigMap('postgres', 'postgresql');

      expect(configMap.metadata.name).toBe('postgres-config');
      expect(configMap.data['POSTGRES_DB']).toBe('myapp');
      expect(configMap.data['POSTGRES_USER']).toBe('postgres');
    });
  });
});
