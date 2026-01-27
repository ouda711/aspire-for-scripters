import type { ProjectConfig } from '../../config/schema.js';

/**
 * Kubernetes Secret specification
 */
export interface K8sSecret {
  apiVersion: string;
  kind: string;
  metadata: {
    name: string;
    labels: Record<string, string>;
  };
  type: string;
  stringData: Record<string, string>;
}

/**
 * Builds Kubernetes Secret manifests
 */
export class SecretBuilder {
  /**
   * Create application Secret
   */
  static createAppSecret(config: ProjectConfig): K8sSecret {
    const stringData: Record<string, string> = {};

    // Add database passwords
    if (config.sqlDatabase === 'postgresql') {
      stringData['postgres-password'] = 'CHANGE_ME_IN_PRODUCTION';
    } else if (config.sqlDatabase === 'mysql') {
      stringData['mysql-password'] = 'CHANGE_ME_IN_PRODUCTION';
      stringData['mysql-root-password'] = 'CHANGE_ME_IN_PRODUCTION';
    }

    // Add MongoDB password
    if (config.nosqlDatabases?.includes('mongodb')) {
      stringData['mongodb-password'] = 'CHANGE_ME_IN_PRODUCTION';
    }

    // Add JWT secret
    if (config.includeAuth) {
      stringData['jwt-secret'] = 'CHANGE_ME_IN_PRODUCTION_USE_LONG_RANDOM_STRING';
    }

    return {
      apiVersion: 'v1',
      kind: 'Secret',
      metadata: {
        name: `${config.name}-secret`,
        labels: { app: config.name },
      },
      type: 'Opaque',
      stringData,
    };
  }

  /**
   * Create database Secret
   */
  static createDatabaseSecret(name: string, database: string): K8sSecret {
    const stringData: Record<string, string> = {};

    if (database === 'postgresql') {
      stringData['password'] = 'CHANGE_ME_IN_PRODUCTION';
    } else if (database === 'mysql') {
      stringData['password'] = 'CHANGE_ME_IN_PRODUCTION';
      stringData['root-password'] = 'CHANGE_ME_IN_PRODUCTION';
    }

    return {
      apiVersion: 'v1',
      kind: 'Secret',
      metadata: {
        name: `${name}-secret`,
        labels: { app: name },
      },
      type: 'Opaque',
      stringData,
    };
  }

  /**
   * Validate secret has all required fields
   */
  static validate(secret: K8sSecret): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!secret.stringData || Object.keys(secret.stringData).length === 0) {
      errors.push('Secret must contain at least one key');
    }

    // Check for placeholder passwords
    const placeholders = ['CHANGE_ME', 'password', '123456'];
    for (const [key, value] of Object.entries(secret.stringData || {})) {
      if (placeholders.some((p) => value.includes(p))) {
        // This is expected in templates, just a warning
        console.warn(`Secret key "${key}" contains placeholder value - change in production`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
