import { describe, it, expect } from 'vitest';
import { HealthCheckBuilder } from '../../../src/orchestration/health-check-builder.js';

describe('HealthCheckBuilder', () => {
  describe('http', () => {
    it('should create HTTP health check with defaults', () => {
      const healthCheck = HealthCheckBuilder.http(3000);

      expect(healthCheck.test).toEqual(['CMD', 'curl', '-f', 'http://localhost:3000/health']);
      expect(healthCheck.interval).toBe('30s');
      expect(healthCheck.timeout).toBe('10s');
      expect(healthCheck.retries).toBe(3);
      expect(healthCheck.start_period).toBe('40s');
    });

    it('should create HTTP health check with custom path', () => {
      const healthCheck = HealthCheckBuilder.http(3000, '/api/health');

      expect(healthCheck.test).toEqual(['CMD', 'curl', '-f', 'http://localhost:3000/api/health']);
    });

    it('should create HTTP health check with custom options', () => {
      const healthCheck = HealthCheckBuilder.http(3000, '/health', {
        interval: '20s',
        timeout: '5s',
        retries: 5,
      });

      expect(healthCheck.interval).toBe('20s');
      expect(healthCheck.timeout).toBe('5s');
      expect(healthCheck.retries).toBe(5);
    });

    it('should work with environment variable port', () => {
      const healthCheck = HealthCheckBuilder.http('${PORT:-3000}');

      expect(healthCheck.test).toEqual(['CMD', 'curl', '-f', 'http://localhost:${PORT:-3000}/health']);
    });
  });

  describe('postgres', () => {
    it('should create PostgreSQL health check with defaults', () => {
      const healthCheck = HealthCheckBuilder.postgres();

      expect(healthCheck.test).toEqual(['CMD-SHELL', 'pg_isready -U postgres']);
      expect(healthCheck.interval).toBe('10s');
      expect(healthCheck.timeout).toBe('5s');
      expect(healthCheck.retries).toBe(5);
    });

    it('should create PostgreSQL health check with custom user', () => {
      const healthCheck = HealthCheckBuilder.postgres('myuser');

      expect(healthCheck.test).toEqual(['CMD-SHELL', 'pg_isready -U myuser']);
    });
  });

  describe('mysql', () => {
    it('should create MySQL health check', () => {
      const healthCheck = HealthCheckBuilder.mysql();

      expect(healthCheck.test).toEqual(['CMD', 'mysqladmin', 'ping', '-h', 'localhost']);
      expect(healthCheck.interval).toBe('10s');
      expect(healthCheck.timeout).toBe('5s');
      expect(healthCheck.retries).toBe(5);
    });
  });

  describe('redis', () => {
    it('should create Redis health check', () => {
      const healthCheck = HealthCheckBuilder.redis();

      expect(healthCheck.test).toEqual(['CMD', 'redis-cli', 'ping']);
      expect(healthCheck.interval).toBe('10s');
      expect(healthCheck.timeout).toBe('5s');
      expect(healthCheck.retries).toBe(5);
    });
  });

  describe('rabbitmq', () => {
    it('should create RabbitMQ health check', () => {
      const healthCheck = HealthCheckBuilder.rabbitmq();

      expect(healthCheck.test).toEqual(['CMD', 'rabbitmq-diagnostics', '-q', 'ping']);
      expect(healthCheck.interval).toBe('30s');
      expect(healthCheck.timeout).toBe('10s');
      expect(healthCheck.retries).toBe(3);
    });
  });

  describe('custom', () => {
    it('should create custom health check', () => {
      const healthCheck = HealthCheckBuilder.custom(['CMD', 'echo', 'hello']);

      expect(healthCheck.test).toEqual(['CMD', 'echo', 'hello']);
      expect(healthCheck.interval).toBe('30s');
      expect(healthCheck.timeout).toBe('10s');
      expect(healthCheck.retries).toBe(3);
    });

    it('should create custom health check with options', () => {
      const healthCheck = HealthCheckBuilder.custom(['CMD', 'test'], {
        interval: '15s',
        timeout: '3s',
        retries: 2,
        start_period: '10s',
      });

      expect(healthCheck.interval).toBe('15s');
      expect(healthCheck.timeout).toBe('3s');
      expect(healthCheck.retries).toBe(2);
      expect(healthCheck.start_period).toBe('10s');
    });
  });
});
