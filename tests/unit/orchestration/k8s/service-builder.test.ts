import { describe, it, expect } from 'vitest';
import { ServiceBuilder } from '../../../../src/orchestration/k8s/service-builder.js';

describe('ServiceBuilder', () => {
  describe('createClusterIPService', () => {
    it('should create ClusterIP service', () => {
      const service = ServiceBuilder.createClusterIPService(
        'test-app',
        80,
        3000,
        { app: 'test-app' }
      );

      expect(service.apiVersion).toBe('v1');
      expect(service.kind).toBe('Service');
      expect(service.metadata.name).toBe('test-app');
      expect(service.spec.type).toBe('ClusterIP');
      expect(service.spec.selector).toEqual({ app: 'test-app' });
      expect(service.spec.ports[0].port).toBe(80);
      expect(service.spec.ports[0].targetPort).toBe(3000);
    });
  });

  describe('createLoadBalancerService', () => {
    it('should create LoadBalancer service', () => {
      const service = ServiceBuilder.createLoadBalancerService(
        'test-app',
        80,
        3000,
        { app: 'test-app' }
      );

      expect(service.kind).toBe('Service');
      expect(service.spec.type).toBe('LoadBalancer');
      expect(service.metadata.name).toBe('test-app-external');
    });
  });

  describe('createNodePortService', () => {
    it('should create NodePort service', () => {
      const service = ServiceBuilder.createNodePortService(
        'test-app',
        80,
        3000,
        30080,
        { app: 'test-app' }
      );

      expect(service.kind).toBe('Service');
      expect(service.spec.type).toBe('NodePort');
      expect(service.spec.ports[0].nodePort).toBe(30080);
    });
  });

  describe('createDatabaseService', () => {
    it('should create database service', () => {
      const service = ServiceBuilder.createDatabaseService('postgres', 5432);

      expect(service.metadata.name).toBe('postgres');
      expect(service.spec.type).toBe('ClusterIP');
      expect(service.spec.ports[0].port).toBe(5432);
    });
  });
});
