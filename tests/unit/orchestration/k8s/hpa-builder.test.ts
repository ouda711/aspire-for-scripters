import { describe, it, expect } from 'vitest';
import { HPABuilder } from '../../../../src/orchestration/k8s/hpa-builder.js';

describe('HPABuilder', () => {
  describe('createAppHPA', () => {
    it('should create basic HPA', () => {
      const hpa = HPABuilder.createAppHPA('test-app');

      expect(hpa.apiVersion).toBe('autoscaling/v2');
      expect(hpa.kind).toBe('HorizontalPodAutoscaler');
      expect(hpa.metadata.name).toBe('test-app-hpa');
      expect(hpa.spec.minReplicas).toBe(2);
      expect(hpa.spec.maxReplicas).toBe(10);
    });

    it('should target correct deployment', () => {
      const hpa = HPABuilder.createAppHPA('test-app');

      expect(hpa.spec.scaleTargetRef.kind).toBe('Deployment');
      expect(hpa.spec.scaleTargetRef.name).toBe('test-app');
    });

    it('should include CPU and memory metrics', () => {
      const hpa = HPABuilder.createAppHPA('test-app');

      expect(hpa.spec.metrics).toHaveLength(2);
      expect(hpa.spec.metrics[0].resource?.name).toBe('cpu');
      expect(hpa.spec.metrics[1].resource?.name).toBe('memory');
    });
  });

  describe('validate', () => {
    it('should return valid result for valid HPA', () => {
      const hpa = HPABuilder.createAppHPA('test-app');

      const result = HPABuilder.validate(hpa);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect invalid minReplicas', () => {
      const hpa = HPABuilder.createAppHPA('test-app', 0, 10);

      const result = HPABuilder.validate(hpa);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('minReplicas must be at least 1');
    });
  });
});
