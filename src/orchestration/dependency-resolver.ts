import type { ServiceDefinition } from './service-registry.js';

/**
 * Error thrown when circular dependencies are detected
 */
export class CircularDependencyError extends Error {
  constructor(public readonly cycle: string[]) {
    super(`Circular dependency detected: ${cycle.join(' -> ')}`);
    this.name = 'CircularDependencyError';
  }
}

/**
 * Error thrown when a dependency is missing
 */
export class MissingDependencyError extends Error {
  constructor(
    public readonly service: string,
    public readonly dependency: string,
  ) {
    super(`Service "${service}" depends on "${dependency}", which is not defined`);
    this.name = 'MissingDependencyError';
  }
}

/**
 * Dependency resolver that sorts services by dependencies
 */
export class DependencyResolver {
  /**
   * Sort services based on their dependencies using topological sort
   */
  static sortByDependencies(services: ServiceDefinition[]): ServiceDefinition[] {
    // First validate dependencies
    this.validateDependencies(services);

    // Create a map of services by name for quick lookup
    const serviceMap = new Map<string, ServiceDefinition>();
    services.forEach(service => serviceMap.set(service.name, service));

    // Track visited and visiting nodes for cycle detection
    const visited = new Set<string>();
    const visiting = new Set<string>();
    const sorted: ServiceDefinition[] = [];

    const visit = (serviceName: string, path: string[] = []): void => {
      // If already visited, skip
      if (visited.has(serviceName)) {
        return;
      }

      // If currently visiting, we have a cycle
      if (visiting.has(serviceName)) {
        throw new CircularDependencyError([...path, serviceName]);
      }

      const service = serviceMap.get(serviceName);
      if (!service) {
        return;
      }

      // Mark as visiting
      visiting.add(serviceName);
      path.push(serviceName);

      // Visit all dependencies first
      if (service.depends_on) {
        for (const dep of Object.keys(service.depends_on)) {
          visit(dep, [...path]);
        }
      }

      // Mark as visited and add to sorted list
      visiting.delete(serviceName);
      visited.add(serviceName);
      sorted.push(service);
    };

    // Visit each service
    for (const service of services) {
      visit(service.name);
    }

    return sorted;
  }

  /**
   * Validate that all dependencies exist
   */
  static validateDependencies(services: ServiceDefinition[]): void {
    const serviceNames = new Set(services.map(s => s.name));

    for (const service of services) {
      if (service.depends_on) {
        for (const dep of Object.keys(service.depends_on)) {
          if (!serviceNames.has(dep)) {
            throw new MissingDependencyError(service.name, dep);
          }
        }
      }
    }
  }

  /**
   * Get dependency graph as an adjacency list
   */
  static getDependencyGraph(services: ServiceDefinition[]): Map<string, string[]> {
    const graph = new Map<string, string[]>();

    for (const service of services) {
      const deps = service.depends_on ? Object.keys(service.depends_on) : [];
      graph.set(service.name, deps);
    }

    return graph;
  }

  /**
   * Check if there are any circular dependencies
   */
  static hasCircularDependencies(services: ServiceDefinition[]): boolean {
    try {
      this.sortByDependencies(services);
      return false;
    } catch (error) {
      return error instanceof CircularDependencyError;
    }
  }
}
