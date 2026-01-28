import { describe, it, expect } from 'vitest';
import { IngressBuilder } from '../../../../src/orchestration/k8s/ingress-builder.js';

describe('IngressBuilder', () => {
  describe('createAppIngress', () => {
    it('should create basic ingress', () => {
      const ingress = IngressBuilder.createAppIngress(
        'test-app',
        'test-app.example.com',
        'test-app',
        80,
        false
      );

      expect(ingress.apiVersion).toBe('networking.k8s.io/v1');
      expect(ingress.kind).toBe('Ingress');
      expect(ingress.metadata.name).toBe('test-app-ingress');
      expect(ingress.spec.ingressClassName).toBe('nginx');
    });

    it('should configure host and path', () => {
      const ingress = IngressBuilder.createAppIngress(
        'test-app',
        'test-app.example.com',
        'test-app',
        80,
        false
      );

      expect(ingress.spec.rules[0].host).toBe('test-app.example.com');
      expect(ingress.spec.rules[0].http.paths[0].path).toBe('/');
      expect(ingress.spec.rules[0].http.paths[0].backend.service.name).toBe('test-app');
    });

    it('should include TLS when enabled', () => {
      const ingress = IngressBuilder.createAppIngress(
        'test-app',
        'test-app.example.com',
        'test-app',
        80,
        true
      );

      expect(ingress.spec.tls).toBeDefined();
      expect(ingress.spec.tls?.[0].hosts).toContain('test-app.example.com');
      expect(ingress.spec.tls?.[0].secretName).toBe('test-app-tls');
    });

    it('should not include TLS when disabled', () => {
      const ingress = IngressBuilder.createAppIngress(
        'test-app',
        'test-app.example.com',
        'test-app',
        80,
        false
      );

      expect(ingress.spec.tls).toBeUndefined();
    });
  });
});
