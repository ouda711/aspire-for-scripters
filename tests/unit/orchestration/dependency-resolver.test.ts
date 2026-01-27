import { describe, it, expect } from 'vitest';
import {
  DependencyResolver,
  CircularDependencyError,
  MissingDependencyError,
} from '../../../src/orchestration/dependency-resolver.js';
import type { ServiceDefinition } from '../../../src/orchestration/service-registry.js';

describe('DependencyResolver', () => {
  describe('sortByDependencies', () => {
    it('should sort services with no dependencies', () => {
      const services: ServiceDefinition[] = [
        { name: 'service1', networks: [] },
        { name: 'service2', networks: [] },
        { name: 'service3', networks: [] },
      ];

      const sorted = DependencyResolver.sortByDependencies(services);

      expect(sorted).toHaveLength(3);
      expect(sorted.map(s => s.name)).toEqual(expect.arrayContaining(['service1', 'service2', 'service3']));
    });

    it('should sort services with simple dependencies', () => {
      const services: ServiceDefinition[] = [
        {
          name: 'app',
          depends_on: { postgres: { condition: 'service_healthy' } },
          networks: [],
        },
        { name: 'postgres', networks: [] },
      ];

      const sorted = DependencyResolver.sortByDependencies(services);

      expect(sorted).toHaveLength(2);
      expect(sorted[0].name).toBe('postgres');
      expect(sorted[1].name).toBe('app');
    });

    it('should sort services with multiple dependencies', () => {
      const services: ServiceDefinition[] = [
        {
          name: 'app',
          depends_on: {
            postgres: { condition: 'service_healthy' },
            redis: { condition: 'service_healthy' },
          },
          networks: [],
        },
        { name: 'postgres', networks: [] },
        { name: 'redis', networks: [] },
      ];

      const sorted = DependencyResolver.sortByDependencies(services);

      expect(sorted).toHaveLength(3);
      const appIndex = sorted.findIndex(s => s.name === 'app');
      const postgresIndex = sorted.findIndex(s => s.name === 'postgres');
      const redisIndex = sorted.findIndex(s => s.name === 'redis');

      expect(appIndex).toBeGreaterThan(postgresIndex);
      expect(appIndex).toBeGreaterThan(redisIndex);
    });

    it('should detect circular dependencies', () => {
      const services: ServiceDefinition[] = [
        {
          name: 'service1',
          depends_on: { service2: { condition: 'service_started' } },
          networks: [],
        },
        {
          name: 'service2',
          depends_on: { service1: { condition: 'service_started' } },
          networks: [],
        },
      ];

      expect(() => DependencyResolver.sortByDependencies(services)).toThrow(CircularDependencyError);
    });

    it('should throw error for missing dependency', () => {
      const services: ServiceDefinition[] = [
        {
          name: 'app',
          depends_on: { missing: { condition: 'service_healthy' } },
          networks: [],
        },
      ];

      expect(() => DependencyResolver.sortByDependencies(services)).toThrow(MissingDependencyError);
    });
  });

  describe('validateDependencies', () => {
    it('should pass for valid dependencies', () => {
      const services: ServiceDefinition[] = [
        {
          name: 'app',
          depends_on: { postgres: { condition: 'service_healthy' } },
          networks: [],
        },
        { name: 'postgres', networks: [] },
      ];

      expect(() => DependencyResolver.validateDependencies(services)).not.toThrow();
    });

    it('should throw for missing dependency', () => {
      const services: ServiceDefinition[] = [
        {
          name: 'app',
          depends_on: { missing: { condition: 'service_healthy' } },
          networks: [],
        },
      ];

      expect(() => DependencyResolver.validateDependencies(services)).toThrow(MissingDependencyError);
      expect(() => DependencyResolver.validateDependencies(services)).toThrow('missing');
    });
  });

  describe('getDependencyGraph', () => {
    it('should create dependency graph', () => {
      const services: ServiceDefinition[] = [
        {
          name: 'app',
          depends_on: { postgres: { condition: 'service_healthy' } },
          networks: [],
        },
        { name: 'postgres', networks: [] },
      ];

      const graph = DependencyResolver.getDependencyGraph(services);

      expect(graph.get('app')).toEqual(['postgres']);
      expect(graph.get('postgres')).toEqual([]);
    });
  });

  describe('hasCircularDependencies', () => {
    it('should return false for valid dependencies', () => {
      const services: ServiceDefinition[] = [
        {
          name: 'app',
          depends_on: { postgres: { condition: 'service_healthy' } },
          networks: [],
        },
        { name: 'postgres', networks: [] },
      ];

      expect(DependencyResolver.hasCircularDependencies(services)).toBe(false);
    });

    it('should return true for circular dependencies', () => {
      const services: ServiceDefinition[] = [
        {
          name: 'service1',
          depends_on: { service2: { condition: 'service_started' } },
          networks: [],
        },
        {
          name: 'service2',
          depends_on: { service1: { condition: 'service_started' } },
          networks: [],
        },
      ];

      expect(DependencyResolver.hasCircularDependencies(services)).toBe(true);
    });
  });
});
