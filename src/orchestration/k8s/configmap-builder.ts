import type { ProjectConfig } from '../../config/schema.js';

/**
 * Kubernetes ConfigMap specification
 */
export interface K8sConfigMap {
  apiVersion: string;
  kind: string;
  metadata: {
    name: string;
    labels: Record<string, string>;
  };
  data: Record<string, string>;
}

/**
 * Builds Kubernetes ConfigMap manifests
 */
export class ConfigMapBuilder {
  /**
   * Create application ConfigMap
   */
  static createAppConfigMap(config: ProjectConfig): K8sConfigMap {
    const data: Record<string, string> = {
      'log-level': 'info',
      'node-env': 'production',
    };

    // Add database configuration
    if (config.sqlDatabase === 'postgresql') {
      data['postgres-host'] = 'postgres';
      data['postgres-port'] = '5432';
      data['postgres-database'] = 'myapp';
      data['postgres-user'] = 'postgres';
    } else if (config.sqlDatabase === 'mysql') {
      data['mysql-host'] = 'mysql';
      data['mysql-port'] = '3306';
      data['mysql-database'] = 'myapp';
    }

    // Add Redis configuration
    if (config.nosqlDatabases?.includes('redis')) {
      data['redis-host'] = 'redis';
      data['redis-port'] = '6379';
    }

    // Add MongoDB configuration
    if (config.nosqlDatabases?.includes('mongodb')) {
      data['mongodb-host'] = 'mongodb';
      data['mongodb-port'] = '27017';
      data['mongodb-database'] = 'myapp';
    }

    return {
      apiVersion: 'v1',
      kind: 'ConfigMap',
      metadata: {
        name: `${config.name}-config`,
        labels: { app: config.name },
      },
      data,
    };
  }

  /**
   * Create database ConfigMap
   */
  static createDatabaseConfigMap(name: string, database: string): K8sConfigMap {
    const data: Record<string, string> = {};

    if (database === 'postgresql') {
      data['POSTGRES_DB'] = 'myapp';
      data['POSTGRES_USER'] = 'postgres';
    } else if (database === 'mysql') {
      data['MYSQL_DATABASE'] = 'myapp';
      data['MYSQL_USER'] = 'user';
    }

    return {
      apiVersion: 'v1',
      kind: 'ConfigMap',
      metadata: {
        name: `${name}-config`,
        labels: { app: name },
      },
      data,
    };
  }
}
