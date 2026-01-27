/**
 * Kubernetes HorizontalPodAutoscaler specification
 */
export interface K8sHPA {
  apiVersion: string;
  kind: string;
  metadata: {
    name: string;
    labels: Record<string, string>;
  };
  spec: {
    scaleTargetRef: {
      apiVersion: string;
      kind: string;
      name: string;
    };
    minReplicas: number;
    maxReplicas: number;
    metrics: Array<{
      type: string;
      resource?: {
        name: string;
        target: {
          type: string;
          averageUtilization: number;
        };
      };
    }>;
  };
}

/**
 * Builds Kubernetes HPA manifests
 */
export class HPABuilder {
  /**
   * Create HPA for application
   */
  static createAppHPA(
    appName: string,
    minReplicas: number = 2,
    maxReplicas: number = 10,
    cpuThreshold: number = 70,
    memoryThreshold: number = 80
  ): K8sHPA {
    return {
      apiVersion: 'autoscaling/v2',
      kind: 'HorizontalPodAutoscaler',
      metadata: {
        name: `${appName}-hpa`,
        labels: { app: appName },
      },
      spec: {
        scaleTargetRef: {
          apiVersion: 'apps/v1',
          kind: 'Deployment',
          name: appName,
        },
        minReplicas,
        maxReplicas,
        metrics: [
          {
            type: 'Resource',
            resource: {
              name: 'cpu',
              target: {
                type: 'Utilization',
                averageUtilization: cpuThreshold,
              },
            },
          },
          {
            type: 'Resource',
            resource: {
              name: 'memory',
              target: {
                type: 'Utilization',
                averageUtilization: memoryThreshold,
              },
            },
          },
        ],
      },
    };
  }

  /**
   * Validate HPA configuration
   */
  static validate(hpa: K8sHPA): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (hpa.spec.minReplicas < 1) {
      errors.push('minReplicas must be at least 1');
    }

    if (hpa.spec.maxReplicas < hpa.spec.minReplicas) {
      errors.push('maxReplicas must be greater than or equal to minReplicas');
    }

    if (hpa.spec.metrics.length === 0) {
      errors.push('HPA must have at least one metric');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
