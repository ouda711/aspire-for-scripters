/**
 * Network configuration
 */
export interface NetworkConfig {
  driver: string;
  internal?: boolean;
  attachable?: boolean;
  labels?: Record<string, string>;
}

/**
 * Network builder for Docker Compose
 */
export class NetworkBuilder {
  /**
   * Create default application network
   */
  static appNetwork(): NetworkConfig {
    return {
      driver: 'bridge',
      attachable: true,
    };
  }

  /**
   * Create internal network (no external access)
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  static internalNetwork(name = 'internal'): NetworkConfig {
    return {
      driver: 'bridge',
      internal: true,
      attachable: false,
    };
  }

  /**
   * Get networks for a project
   */
  static getNetworks(): Record<string, NetworkConfig> {
    return {
      'app-network': this.appNetwork(),
    };
  }
}
