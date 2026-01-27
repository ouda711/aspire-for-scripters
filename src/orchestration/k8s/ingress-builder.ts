/**
 * Kubernetes Ingress specification
 */
export interface K8sIngress {
  apiVersion: string;
  kind: string;
  metadata: {
    name: string;
    labels: Record<string, string>;
    annotations?: Record<string, string>;
  };
  spec: {
    ingressClassName?: string;
    rules: Array<{
      host?: string;
      http: {
        paths: Array<{
          path: string;
          pathType: string;
          backend: {
            service: {
              name: string;
              port: {
                number: number;
              };
            };
          };
        }>;
      };
    }>;
    tls?: Array<{
      hosts: string[];
      secretName: string;
    }>;
  };
}

/**
 * Builds Kubernetes Ingress manifests
 */
export class IngressBuilder {
  /**
   * Create application Ingress
   */
  static createAppIngress(
    appName: string,
    host: string,
    serviceName: string,
    servicePort: number,
    enableTLS: boolean = false
  ): K8sIngress {
    const ingress: K8sIngress = {
      apiVersion: 'networking.k8s.io/v1',
      kind: 'Ingress',
      metadata: {
        name: `${appName}-ingress`,
        labels: { app: appName },
        annotations: {
          'nginx.ingress.kubernetes.io/rewrite-target': '/',
        },
      },
      spec: {
        ingressClassName: 'nginx',
        rules: [
          {
            host,
            http: {
              paths: [
                {
                  path: '/',
                  pathType: 'Prefix',
                  backend: {
                    service: {
                      name: serviceName,
                      port: {
                        number: servicePort,
                      },
                    },
                  },
                },
              ],
            },
          },
        ],
      },
    };

    // Add TLS configuration if enabled
    if (enableTLS) {
      ingress.spec.tls = [
        {
          hosts: [host],
          secretName: `${appName}-tls`,
        },
      ];
    }

    return ingress;
  }

  /**
   * Create Ingress with multiple paths
   */
  static createMultiPathIngress(
    appName: string,
    host: string,
    paths: Array<{ path: string; serviceName: string; servicePort: number }>
  ): K8sIngress {
    return {
      apiVersion: 'networking.k8s.io/v1',
      kind: 'Ingress',
      metadata: {
        name: `${appName}-ingress`,
        labels: { app: appName },
      },
      spec: {
        ingressClassName: 'nginx',
        rules: [
          {
            host,
            http: {
              paths: paths.map((p) => ({
                path: p.path,
                pathType: 'Prefix' as const,
                backend: {
                  service: {
                    name: p.serviceName,
                    port: {
                      number: p.servicePort,
                    },
                  },
                },
              })),
            },
          },
        ],
      },
    };
  }
}
