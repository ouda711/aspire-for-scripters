import { describe, it, expect } from 'vitest';
import { NetworkBuilder } from '../../../src/orchestration/network-builder.js';

describe('NetworkBuilder', () => {
  describe('appNetwork', () => {
    it('should create default app network', () => {
      const network = NetworkBuilder.appNetwork();

      expect(network.driver).toBe('bridge');
      expect(network.attachable).toBe(true);
      expect(network.internal).toBeUndefined();
    });
  });

  describe('internalNetwork', () => {
    it('should create internal network', () => {
      const network = NetworkBuilder.internalNetwork();

      expect(network.driver).toBe('bridge');
      expect(network.internal).toBe(true);
      expect(network.attachable).toBe(false);
    });

    it('should create internal network with custom name', () => {
      const network = NetworkBuilder.internalNetwork('private');

      expect(network.driver).toBe('bridge');
      expect(network.internal).toBe(true);
      expect(network.attachable).toBe(false);
    });
  });

  describe('getNetworks', () => {
    it('should return networks configuration', () => {
      const networks = NetworkBuilder.getNetworks();

      expect(networks).toHaveProperty('app-network');
      expect(networks['app-network'].driver).toBe('bridge');
      expect(networks['app-network'].attachable).toBe(true);
    });
  });
});
