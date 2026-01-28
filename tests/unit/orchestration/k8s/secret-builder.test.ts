import { describe, it, expect, vi } from 'vitest';
import { SecretBuilder } from '../../../../src/orchestration/k8s/secret-builder.js';
import type { ProjectConfig } from '../../../../src/config/schema.js';

describe('SecretBuilder', () => {
  describe('createAppSecret', () => {
    it('should create basic app secret', () => {
      const config = {
        name: 'test-app',
        nosqlDatabases: [],
      } as ProjectConfig;

      const secret = SecretBuilder.createAppSecret(config);

      expect(secret.apiVersion).toBe('v1');
      expect(secret.kind).toBe('Secret');
      expect(secret.metadata.name).toBe('test-app-secret');
      expect(secret.type).toBe('Opaque');
    });

    it('should include PostgreSQL password', () => {
      const config = {
        name: 'test-app',
        sqlDatabase: 'postgresql',
        nosqlDatabases: [],
      } as ProjectConfig;

      const secret = SecretBuilder.createAppSecret(config);

      expect(secret.stringData['postgres-password']).toBe('CHANGE_ME_IN_PRODUCTION');
    });

    it('should include JWT secret when auth is enabled', () => {
      const config = {
        name: 'test-app',
        includeAuth: true,
        nosqlDatabases: [],
      } as ProjectConfig;

      const secret = SecretBuilder.createAppSecret(config);

      expect(secret.stringData['jwt-secret']).toBe('CHANGE_ME_IN_PRODUCTION_USE_LONG_RANDOM_STRING');
    });
  });

  describe('validate', () => {
    it('should return valid=true for valid secret', () => {
      const secret = {
        apiVersion: 'v1',
        kind: 'Secret',
        metadata: { name: 'test', labels: {} },
        type: 'Opaque',
        stringData: { key: 'value' },
      };

      const result = SecretBuilder.validate(secret);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should warn about placeholder values', () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const secret = {
        apiVersion: 'v1',
        kind: 'Secret',
        metadata: { name: 'test', labels: {} },
        type: 'Opaque',
        stringData: { password: 'CHANGE_ME_IN_PRODUCTION' },
      };

      SecretBuilder.validate(secret);

      expect(consoleWarnSpy).toHaveBeenCalled();
      consoleWarnSpy.mockRestore();
    });
  });
});
