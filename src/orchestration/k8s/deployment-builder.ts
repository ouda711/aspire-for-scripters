import type { ProjectConfig } from '../../config/schema.js';

/**
 * Kubernetes Deployment specification
 */
export interface K8sDeployment {
  apiVersion: string;
  kind: string;
  metadata: {
    name: string;
    labels: Record<string, string>;
    namespace?: string;
  };
  spec: {
    replicas: number;
    selector: {
      matchLabels: Record<string, string>;
    };
    template: {
      metadata: {
        labels: Record<string, string>;
      };
      spec: {
        containers: Array<{
          name: string;
          image: string;
          ports?: Array<{
            containerPort: number;
            protocol?: string;
          }>;
          env?: Array<{
            name: string;
            value?: string;
            valueFrom?: any;
          }>;
          resources?: {
            requests: {
              cpu: string;
              memory: string;
            };
            limits: {
              cpu: string;
              memory: string;
            };
          };
          livenessProbe?: any;
          readinessProbe?: any;
          volumeMounts?: Array<{
            name: string;
            mountPath: string;
          }>;
        }>;
        volumes?: Array<any>;
      };
    };
  };
}

/**
 * Builds Kubernetes Deployment manifests
 */
export class DeploymentBuilder {
  /**
   * Create application deployment
   */
  static createAppDeployment(config: ProjectConfig): K8sDeployment {
    const labels = {
      app: config.name,
      tier: 'application',
      framework: config.framework,
    };

    const deployment: K8sDeployment = {
      apiVersion: 'apps/v1',
      kind: 'Deployment',
      metadata: {
        name: config.name,
        labels,
      },
      spec: {
        replicas: 3,
        selector: {
          matchLabels: { app: config.name },
        },
        template: {
          metadata: {
            labels,
          },
          spec: {
            containers: [
              {
                name: config.name,
                image: `${config.name}:latest`,
                ports: [
                  {
                    containerPort: 3000,
                    protocol: 'TCP',
                  },
                ],
                env: this.getAppEnvironmentVariables(config),
                resources: {
                  requests: {
                    cpu: '100m',
                    memory: '128Mi',
                  },
                  limits: {
                    cpu: '500m',
                    memory: '512Mi',
                  },
                },
                livenessProbe: {
                  httpGet: {
                    path: '/health',
                    port: 3000,
                  },
                  initialDelaySeconds: 30,
                  periodSeconds: 10,
                  timeoutSeconds: 5,
                  failureThreshold: 3,
                },
                readinessProbe: {
                  httpGet: {
                    path: '/health',
                    port: 3000,
                  },
                  initialDelaySeconds: 10,
                  periodSeconds: 5,
                  timeoutSeconds: 3,
                  failureThreshold: 3,
                },
              },
            ],
          },
        },
      },
    };

    return deployment;
  }

  /**
   * Create database deployment (StatefulSet would be better for production)
   */
  static createDatabaseDeployment(
    name: string,
    image: string,
    port: number,
    labels: Record<string, string>
  ): K8sDeployment {
    return {
      apiVersion: 'apps/v1',
      kind: 'Deployment',
      metadata: {
        name,
        labels,
      },
      spec: {
        replicas: 1, // Single replica for development
        selector: {
          matchLabels: { app: name },
        },
        template: {
          metadata: {
            labels,
          },
          spec: {
            containers: [
              {
                name,
                image,
                ports: [
                  {
                    containerPort: port,
                  },
                ],
                env: [
                  {
                    name: 'POSTGRES_PASSWORD',
                    valueFrom: {
                      secretKeyRef: {
                        name: `${name}-secret`,
                        key: 'password',
                      },
                    },
                  },
                ],
                resources: {
                  requests: {
                    cpu: '100m',
                    memory: '256Mi',
                  },
                  limits: {
                    cpu: '500m',
                    memory: '1Gi',
                  },
                },
                volumeMounts: [
                  {
                    name: `${name}-storage`,
                    mountPath: this.getDatabaseMountPath(name),
                  },
                ],
              },
            ],
            volumes: [
              {
                name: `${name}-storage`,
                persistentVolumeClaim: {
                  claimName: `${name}-pvc`,
                },
              },
            ],
          },
        },
      },
    };
  }

  /**
   * Get environment variables for app
   */
  private static getAppEnvironmentVariables(config: ProjectConfig): Array<any> {
    const env: Array<any> = [
      {
        name: 'NODE_ENV',
        value: 'production',
      },
      {
        name: 'PORT',
        value: '3000',
      },
      {
        name: 'LOG_LEVEL',
        valueFrom: {
          configMapKeyRef: {
            name: `${config.name}-config`,
            key: 'log-level',
          },
        },
      },
    ];

    // Add database connection from ConfigMap
    if (config.sqlDatabase === 'postgresql') {
      env.push(
        {
          name: 'POSTGRES_HOST',
          valueFrom: {
            configMapKeyRef: {
              name: `${config.name}-config`,
              key: 'postgres-host',
            },
          },
        },
        {
          name: 'POSTGRES_PORT',
          value: '5432',
        },
        {
          name: 'POSTGRES_PASSWORD',
          valueFrom: {
            secretKeyRef: {
              name: `${config.name}-secret`,
              key: 'postgres-password',
            },
          },
        }
      );
    }

    // Add Redis connection
    if (config.nosqlDatabases?.includes('redis')) {
      env.push({
        name: 'REDIS_HOST',
        valueFrom: {
          configMapKeyRef: {
            name: `${config.name}-config`,
            key: 'redis-host',
          },
        },
      });
    }

    return env;
  }

  /**
   * Get database mount path
   */
  private static getDatabaseMountPath(database: string): string {
    const paths: Record<string, string> = {
      postgres: '/var/lib/postgresql/data',
      mysql: '/var/lib/mysql',
      mongodb: '/data/db',
      redis: '/data',
    };
    return paths[database] || '/data';
  }
}
