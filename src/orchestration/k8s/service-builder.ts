/**
 * Kubernetes Service specification
 */
export interface K8sService {
  apiVersion: string;
  kind: string;
  metadata: {
    name: string;
    labels: Record<string, string>;
  };
  spec: {
    type: 'ClusterIP' | 'NodePort' | 'LoadBalancer';
    selector: Record<string, string>;
    ports: Array<{
      name?: string;
      port: number;
      targetPort: number;
      protocol?: string;
      nodePort?: number;
    }>;
  };
}

/**
 * Builds Kubernetes Service manifests
 */
export class ServiceBuilder {
  /**
   * Create ClusterIP service (internal only)
   */
  static createClusterIPService(
    name: string,
    port: number,
    targetPort: number,
    selector: Record<string, string>
  ): K8sService {
    return {
      apiVersion: 'v1',
      kind: 'Service',
      metadata: {
        name,
        labels: { app: name },
      },
      spec: {
        type: 'ClusterIP',
        selector,
        ports: [
          {
            name: 'http',
            port,
            targetPort,
            protocol: 'TCP',
          },
        ],
      },
    };
  }

  /**
   * Create LoadBalancer service (external access)
   */
  static createLoadBalancerService(
    name: string,
    port: number,
    targetPort: number,
    selector: Record<string, string>
  ): K8sService {
    return {
      apiVersion: 'v1',
      kind: 'Service',
      metadata: {
        name: `${name}-external`,
        labels: { app: name },
      },
      spec: {
        type: 'LoadBalancer',
        selector,
        ports: [
          {
            name: 'http',
            port,
            targetPort,
            protocol: 'TCP',
          },
        ],
      },
    };
  }

  /**
   * Create NodePort service (for development/testing)
   */
  static createNodePortService(
    name: string,
    port: number,
    targetPort: number,
    nodePort: number,
    selector: Record<string, string>
  ): K8sService {
    return {
      apiVersion: 'v1',
      kind: 'Service',
      metadata: {
        name: `${name}-nodeport`,
        labels: { app: name },
      },
      spec: {
        type: 'NodePort',
        selector,
        ports: [
          {
            name: 'http',
            port,
            targetPort,
            nodePort,
            protocol: 'TCP',
          },
        ],
      },
    };
  }

  /**
   * Create database service
   */
  static createDatabaseService(name: string, port: number): K8sService {
    return this.createClusterIPService(name, port, port, { app: name });
  }
}
