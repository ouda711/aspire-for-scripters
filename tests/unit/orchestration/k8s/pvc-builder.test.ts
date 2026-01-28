import { describe, it, expect } from 'vitest';
import { PVCBuilder } from '../../../../src/orchestration/k8s/pvc-builder.js';

describe('PVCBuilder', () => {
  describe('createDatabasePVC', () => {
    it('should create database PVC', () => {
      const pvc = PVCBuilder.createDatabasePVC('postgres');

      expect(pvc.apiVersion).toBe('v1');
      expect(pvc.kind).toBe('PersistentVolumeClaim');
      expect(pvc.metadata.name).toBe('postgres-pvc');
      expect(pvc.spec.accessModes).toContain('ReadWriteOnce');
      expect(pvc.spec.resources.requests.storage).toBe('10Gi');
    });

    it('should accept custom storage size', () => {
      const pvc = PVCBuilder.createDatabasePVC('postgres', '20Gi');

      expect(pvc.spec.resources.requests.storage).toBe('20Gi');
    });
  });

  describe('createSharedPVC', () => {
    it('should create shared PVC', () => {
      const pvc = PVCBuilder.createSharedPVC('shared-data');

      expect(pvc.metadata.name).toBe('shared-data-shared-pvc');
      expect(pvc.spec.accessModes).toContain('ReadWriteMany');
      expect(pvc.spec.resources.requests.storage).toBe('5Gi');
    });
  });

  describe('validate', () => {
    it('should validate correct PVC', () => {
      const pvc = PVCBuilder.createDatabasePVC('postgres', '10Gi');

      const result = PVCBuilder.validate(pvc);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect invalid storage format', () => {
      const pvc = PVCBuilder.createDatabasePVC('postgres', '10GB');

      const result = PVCBuilder.validate(pvc);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Invalid storage size format (use Gi, Mi, or Ti)');
    });
  });
});
