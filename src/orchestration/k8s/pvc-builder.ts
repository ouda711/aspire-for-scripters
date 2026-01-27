/**
 * Kubernetes PersistentVolumeClaim specification
 */
export interface K8sPVC {
  apiVersion: string;
  kind: string;
  metadata: {
    name: string;
    labels: Record<string, string>;
  };
  spec: {
    accessModes: string[];
    resources: {
      requests: {
        storage: string;
      };
    };
    storageClassName?: string;
  };
}

/**
 * Builds Kubernetes PVC manifests
 */
export class PVCBuilder {
  /**
   * Create PVC for database
   */
  static createDatabasePVC(
    name: string,
    size: string = '10Gi',
    storageClass?: string
  ): K8sPVC {
    const pvc: K8sPVC = {
      apiVersion: 'v1',
      kind: 'PersistentVolumeClaim',
      metadata: {
        name: `${name}-pvc`,
        labels: { app: name },
      },
      spec: {
        accessModes: ['ReadWriteOnce'],
        resources: {
          requests: {
            storage: size,
          },
        },
      },
    };

    if (storageClass) {
      pvc.spec.storageClassName = storageClass;
    }

    return pvc;
  }

  /**
   * Create PVC for shared storage
   */
  static createSharedPVC(
    name: string,
    size: string = '5Gi',
    storageClass?: string
  ): K8sPVC {
    const pvc: K8sPVC = {
      apiVersion: 'v1',
      kind: 'PersistentVolumeClaim',
      metadata: {
        name: `${name}-shared-pvc`,
        labels: { app: name },
      },
      spec: {
        accessModes: ['ReadWriteMany'],
        resources: {
          requests: {
            storage: size,
          },
        },
      },
    };

    if (storageClass) {
      pvc.spec.storageClassName = storageClass;
    }

    return pvc;
  }

  /**
   * Validate PVC configuration
   */
  static validate(pvc: K8sPVC): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!pvc.spec.accessModes || pvc.spec.accessModes.length === 0) {
      errors.push('PVC must have at least one access mode');
    }

    if (!pvc.spec.resources.requests.storage) {
      errors.push('PVC must specify storage size');
    }

    // Validate storage size format
    const sizeRegex = /^\d+(\.\d+)?(Gi|Mi|Ti)$/;
    if (!sizeRegex.test(pvc.spec.resources.requests.storage)) {
      errors.push('Invalid storage size format (use Gi, Mi, or Ti)');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
