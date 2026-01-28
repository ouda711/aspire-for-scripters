import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import path from 'path';
import fs from 'fs-extra';
import { load } from 'js-yaml';
import type { ProjectConfig } from '../../src/config/schema.js';
import { KubernetesGenerator } from '../../src/generators/kubernetes-generator.js';
import type { K8sDeployment } from '../../src/orchestration/k8s/deployment-builder.js';
import type { K8sService } from '../../src/orchestration/k8s/service-builder.js';
import type { K8sConfigMap } from '../../src/orchestration/k8s/configmap-builder.js';
import type { K8sSecret } from '../../src/orchestration/k8s/secret-builder.js';
import type { K8sIngress } from '../../src/orchestration/k8s/ingress-builder.js';
import type { K8sHPA } from '../../src/orchestration/k8s/hpa-builder.js';
import type { K8sPVC } from '../../src/orchestration/k8s/pvc-builder.js';

describe('Kubernetes Deployment Integration', () => {
  const testProjectPath = path.join(process.cwd(), 'test-output', 'k8s-integration');
  const k8sPath = path.join(testProjectPath, 'k8s');

  afterEach(async () => {
    // Clean up test files
    await fs.remove(testProjectPath);
  });

  describe('Complete Express + PostgreSQL + Redis Setup', () => {
    let config: ProjectConfig;

    beforeEach(() => {
      config = {
        name: 'test-app',
        framework: 'express',
        typescript: true,
        sqlDatabase: 'postgresql',
        nosqlDatabases: ['redis'],
        includeAuth: true,
        includeDocker: true,
        includeKubernetes: true,
        includeSwagger: true,
        includeTests: true,
      };
    });

    it('should generate all required Kubernetes manifests', async () => {
      const generator = new KubernetesGenerator(config, testProjectPath);
      await generator.generate();

      // Check all files were created
      const files = await fs.readdir(k8sPath);
      expect(files).toContain('deployment.yml');
      expect(files).toContain('service.yml');
      expect(files).toContain('configmap.yml');
      expect(files).toContain('secret.yml');
      expect(files).toContain('ingress.yml');
      expect(files).toContain('hpa.yml');
      expect(files).toContain('postgres-deployment.yml');
      expect(files).toContain('postgres-service.yml');
      expect(files).toContain('postgres-pvc.yml');
      expect(files).toContain('postgres-secret.yml');
      expect(files).toContain('redis-deployment.yml');
      expect(files).toContain('redis-service.yml');
      expect(files).toContain('redis-pvc.yml');
      expect(files).toContain('README.md');
    });

    it('should generate valid application deployment', async () => {
      const generator = new KubernetesGenerator(config, testProjectPath);
      await generator.generate();

      const deploymentContent = await fs.readFile(
        path.join(k8sPath, 'deployment.yml'),
        'utf-8'
      );
      const deployment = load(deploymentContent) as K8sDeployment;

      expect(deployment.apiVersion).toBe('apps/v1');
      expect(deployment.kind).toBe('Deployment');
      expect(deployment.metadata.name).toBe('test-app');
      expect(deployment.spec.replicas).toBe(3);
      expect(deployment.spec.template.spec.containers).toHaveLength(1);

      const container = deployment.spec.template.spec.containers[0];
      expect(container.name).toBe('test-app');
      expect(container.image).toBe('test-app:latest');
      expect(container.ports?.[0].containerPort).toBe(3000);
      expect(container.resources).toBeDefined();
      expect(container.livenessProbe).toBeDefined();
      expect(container.readinessProbe).toBeDefined();
    });

    it('should configure environment variables correctly', async () => {
      const generator = new KubernetesGenerator(config, testProjectPath);
      await generator.generate();

      const deploymentContent = await fs.readFile(
        path.join(k8sPath, 'deployment.yml'),
        'utf-8'
      );
      const deployment = load(deploymentContent) as K8sDeployment;
      const container = deployment.spec.template.spec.containers[0];

      expect(container.env).toBeDefined();
      expect(container.env?.length).toBeGreaterThan(0);

      // Check for NODE_ENV
      const nodeEnv = container.env?.find((e) => e.name === 'NODE_ENV');
      expect(nodeEnv?.value).toBe('production');

      // Check for PostgreSQL host (from ConfigMap)
      const pgHost = container.env?.find((e) => e.name === 'POSTGRES_HOST');
      expect(pgHost?.valueFrom?.configMapKeyRef).toBeDefined();

      // Check for PostgreSQL password (from Secret)
      const pgPassword = container.env?.find((e) => e.name === 'POSTGRES_PASSWORD');
      expect(pgPassword?.valueFrom?.secretKeyRef).toBeDefined();

      // Check for Redis host
      const redisHost = container.env?.find((e) => e.name === 'REDIS_HOST');
      expect(redisHost?.valueFrom?.configMapKeyRef).toBeDefined();
    });

    it('should generate valid ClusterIP service', async () => {
      const generator = new KubernetesGenerator(config, testProjectPath);
      await generator.generate();

      const serviceContent = await fs.readFile(path.join(k8sPath, 'service.yml'), 'utf-8');
      const service = load(serviceContent) as K8sService;

      expect(service.apiVersion).toBe('v1');
      expect(service.kind).toBe('Service');
      expect(service.metadata.name).toBe('test-app');
      expect(service.spec.type).toBe('ClusterIP');
      expect(service.spec.selector).toEqual({ app: 'test-app' });
      expect(service.spec.ports).toHaveLength(1);
      expect(service.spec.ports[0].port).toBe(80);
      expect(service.spec.ports[0].targetPort).toBe(3000);
    });

    it('should generate valid ConfigMap with database settings', async () => {
      const generator = new KubernetesGenerator(config, testProjectPath);
      await generator.generate();

      const configMapContent = await fs.readFile(
        path.join(k8sPath, 'configmap.yml'),
        'utf-8'
      );
      const configMap = load(configMapContent) as K8sConfigMap;

      expect(configMap.apiVersion).toBe('v1');
      expect(configMap.kind).toBe('ConfigMap');
      expect(configMap.metadata.name).toBe('test-app-config');
      expect(configMap.data).toBeDefined();
      expect(configMap.data['log-level']).toBe('info');
      expect(configMap.data['postgres-host']).toBe('postgres');
      expect(configMap.data['postgres-port']).toBe('5432');
      expect(configMap.data['redis-host']).toBe('redis');
      expect(configMap.data['redis-port']).toBe('6379');
    });

    it('should generate valid Secret with placeholder passwords', async () => {
      const generator = new KubernetesGenerator(config, testProjectPath);
      await generator.generate();

      const secretContent = await fs.readFile(path.join(k8sPath, 'secret.yml'), 'utf-8');
      const secret = load(secretContent) as K8sSecret;

      expect(secret.apiVersion).toBe('v1');
      expect(secret.kind).toBe('Secret');
      expect(secret.metadata.name).toBe('test-app-secret');
      expect(secret.type).toBe('Opaque');
      expect(secret.stringData).toBeDefined();
      expect(secret.stringData['postgres-password']).toBeDefined();
      expect(secret.stringData['jwt-secret']).toBeDefined();
    });

    it('should generate valid Ingress', async () => {
      const generator = new KubernetesGenerator(config, testProjectPath);
      await generator.generate();

      const ingressContent = await fs.readFile(path.join(k8sPath, 'ingress.yml'), 'utf-8');
      const ingress = load(ingressContent) as K8sIngress;

      expect(ingress.apiVersion).toBe('networking.k8s.io/v1');
      expect(ingress.kind).toBe('Ingress');
      expect(ingress.metadata.name).toBe('test-app-ingress');
      expect(ingress.spec.ingressClassName).toBe('nginx');
      expect(ingress.spec.rules).toHaveLength(1);
      expect(ingress.spec.rules[0].host).toBe('test-app.example.com');
      expect(ingress.spec.rules[0].http.paths).toHaveLength(1);
      expect(ingress.spec.rules[0].http.paths[0].path).toBe('/');
      expect(ingress.spec.rules[0].http.paths[0].backend.service.name).toBe('test-app');
      expect(ingress.spec.rules[0].http.paths[0].backend.service.port.number).toBe(80);
    });

    it('should generate valid HPA', async () => {
      const generator = new KubernetesGenerator(config, testProjectPath);
      await generator.generate();

      const hpaContent = await fs.readFile(path.join(k8sPath, 'hpa.yml'), 'utf-8');
      const hpa = load(hpaContent) as K8sHPA;

      expect(hpa.apiVersion).toBe('autoscaling/v2');
      expect(hpa.kind).toBe('HorizontalPodAutoscaler');
      expect(hpa.metadata.name).toBe('test-app-hpa');
      expect(hpa.spec.scaleTargetRef.name).toBe('test-app');
      expect(hpa.spec.minReplicas).toBe(2);
      expect(hpa.spec.maxReplicas).toBe(10);
      expect(hpa.spec.metrics).toHaveLength(2);

      const cpuMetric = hpa.spec.metrics.find((m) => m.resource?.name === 'cpu');
      expect(cpuMetric?.resource?.target.averageUtilization).toBe(70);

      const memoryMetric = hpa.spec.metrics.find((m) => m.resource?.name === 'memory');
      expect(memoryMetric?.resource?.target.averageUtilization).toBe(80);
    });

    it('should generate PostgreSQL deployment', async () => {
      const generator = new KubernetesGenerator(config, testProjectPath);
      await generator.generate();

      const deploymentContent = await fs.readFile(
        path.join(k8sPath, 'postgres-deployment.yml'),
        'utf-8'
      );
      const deployment = load(deploymentContent) as K8sDeployment;

      expect(deployment.metadata.name).toBe('postgres');
      expect(deployment.spec.replicas).toBe(1);
      expect(deployment.spec.template.spec.containers[0].image).toBe('postgres:16-alpine');
      expect(deployment.spec.template.spec.containers[0].ports?.[0].containerPort).toBe(
        5432
      );
      expect(deployment.spec.template.spec.volumes).toBeDefined();
      expect(deployment.spec.template.spec.containers[0].volumeMounts).toBeDefined();
    });

    it('should generate PostgreSQL PVC', async () => {
      const generator = new KubernetesGenerator(config, testProjectPath);
      await generator.generate();

      const pvcContent = await fs.readFile(
        path.join(k8sPath, 'postgres-pvc.yml'),
        'utf-8'
      );
      const pvc = load(pvcContent) as K8sPVC;

      expect(pvc.apiVersion).toBe('v1');
      expect(pvc.kind).toBe('PersistentVolumeClaim');
      expect(pvc.metadata.name).toBe('postgres-pvc');
      expect(pvc.spec.accessModes).toContain('ReadWriteOnce');
      expect(pvc.spec.resources.requests.storage).toBe('10Gi');
    });

    it('should generate Redis deployment', async () => {
      const generator = new KubernetesGenerator(config, testProjectPath);
      await generator.generate();

      const deploymentContent = await fs.readFile(
        path.join(k8sPath, 'redis-deployment.yml'),
        'utf-8'
      );
      const deployment = load(deploymentContent) as K8sDeployment;

      expect(deployment.metadata.name).toBe('redis');
      expect(deployment.spec.replicas).toBe(1);
      expect(deployment.spec.template.spec.containers[0].image).toBe('redis:7-alpine');
      expect(deployment.spec.template.spec.containers[0].ports?.[0].containerPort).toBe(
        6379
      );
    });

    it('should generate comprehensive README', async () => {
      const generator = new KubernetesGenerator(config, testProjectPath);
      await generator.generate();

      const readmeContent = await fs.readFile(path.join(k8sPath, 'README.md'), 'utf-8');

      expect(readmeContent).toContain('Kubernetes Deployment Guide');
      expect(readmeContent).toContain('kubectl apply -f k8s/');
      expect(readmeContent).toContain('deployment.yml');
      expect(readmeContent).toContain('postgres');
      expect(readmeContent).toContain('Update Secrets');
      expect(readmeContent).toContain('Troubleshooting');
    });

    it('should have proper labels on all resources', async () => {
      const generator = new KubernetesGenerator(config, testProjectPath);
      await generator.generate();

      const deployment = load(
        await fs.readFile(path.join(k8sPath, 'deployment.yml'), 'utf-8')
      ) as K8sDeployment;
      const service = load(
        await fs.readFile(path.join(k8sPath, 'service.yml'), 'utf-8')
      ) as K8sService;
      const configMap = load(
        await fs.readFile(path.join(k8sPath, 'configmap.yml'), 'utf-8')
      ) as K8sConfigMap;
      const secret = load(
        await fs.readFile(path.join(k8sPath, 'secret.yml'), 'utf-8')
      ) as K8sSecret;

      expect(deployment.metadata.labels.app).toBe('test-app');
      expect(service.metadata.labels.app).toBe('test-app');
      expect(configMap.metadata.labels.app).toBe('test-app');
      expect(secret.metadata.labels.app).toBe('test-app');
    });

    it('should configure resource limits for all containers', async () => {
      const generator = new KubernetesGenerator(config, testProjectPath);
      await generator.generate();

      const appDeployment = load(
        await fs.readFile(path.join(k8sPath, 'deployment.yml'), 'utf-8')
      ) as K8sDeployment;
      const pgDeployment = load(
        await fs.readFile(path.join(k8sPath, 'postgres-deployment.yml'), 'utf-8')
      ) as K8sDeployment;
      const redisDeployment = load(
        await fs.readFile(path.join(k8sPath, 'redis-deployment.yml'), 'utf-8')
      ) as K8sDeployment;

      // Check app container
      const appContainer = appDeployment.spec.template.spec.containers[0];
      expect(appContainer.resources?.requests.cpu).toBeDefined();
      expect(appContainer.resources?.requests.memory).toBeDefined();
      expect(appContainer.resources?.limits.cpu).toBeDefined();
      expect(appContainer.resources?.limits.memory).toBeDefined();

      // Check PostgreSQL container
      const pgContainer = pgDeployment.spec.template.spec.containers[0];
      expect(pgContainer.resources?.requests.cpu).toBeDefined();
      expect(pgContainer.resources?.limits.memory).toBeDefined();

      // Check Redis container
      const redisContainer = redisDeployment.spec.template.spec.containers[0];
      expect(redisContainer.resources?.requests.cpu).toBeDefined();
      expect(redisContainer.resources?.limits.memory).toBeDefined();
    });
  });

  describe('NestJS + MySQL + MongoDB Setup', () => {
    it('should generate manifests for NestJS with MySQL and MongoDB', async () => {
      const config: ProjectConfig = {
        name: 'nestjs-app',
        framework: 'nestjs',
        typescript: true,
        sqlDatabase: 'mysql',
        nosqlDatabases: ['mongodb'],
        includeAuth: false,
        includeDocker: true,
        includeKubernetes: true,
        includeSwagger: true,
        includeTests: true,
      };

      const generator = new KubernetesGenerator(config, testProjectPath);
      await generator.generate();

      const files = await fs.readdir(k8sPath);
      expect(files).toContain('deployment.yml');
      expect(files).toContain('mysql-deployment.yml');
      expect(files).toContain('mysql-service.yml');
      expect(files).toContain('mysql-pvc.yml');
      expect(files).toContain('mongodb-deployment.yml');
      expect(files).toContain('mongodb-service.yml');
      expect(files).toContain('mongodb-pvc.yml');

      // Verify MySQL deployment
      const mysqlDeployment = load(
        await fs.readFile(path.join(k8sPath, 'mysql-deployment.yml'), 'utf-8')
      ) as K8sDeployment;
      expect(mysqlDeployment.metadata.name).toBe('mysql');
      expect(mysqlDeployment.spec.template.spec.containers[0].image).toBe('mysql:8.0');

      // Verify MongoDB deployment
      const mongoDeployment = load(
        await fs.readFile(path.join(k8sPath, 'mongodb-deployment.yml'), 'utf-8')
      ) as K8sDeployment;
      expect(mongoDeployment.metadata.name).toBe('mongodb');
      expect(mongoDeployment.spec.template.spec.containers[0].image).toBe('mongo:7.0');
    });
  });

  describe('Minimal Setup (No Database)', () => {
    it('should generate minimal manifests without database resources', async () => {
      const config: ProjectConfig = {
        name: 'minimal-app',
        framework: 'express',
        typescript: true,
        sqlDatabase: null,
        nosqlDatabases: [],
        includeAuth: false,
        includeDocker: true,
        includeKubernetes: true,
        includeSwagger: false,
        includeTests: false,
      };

      const generator = new KubernetesGenerator(config, testProjectPath);
      await generator.generate();

      const files = await fs.readdir(k8sPath);

      // Should have basic manifests
      expect(files).toContain('deployment.yml');
      expect(files).toContain('service.yml');
      expect(files).toContain('configmap.yml');
      expect(files).toContain('secret.yml');
      expect(files).toContain('ingress.yml');
      expect(files).toContain('hpa.yml');

      // Should NOT have database manifests
      expect(files).not.toContain('postgres-deployment.yml');
      expect(files).not.toContain('mysql-deployment.yml');
      expect(files).not.toContain('mongodb-deployment.yml');
      expect(files).not.toContain('redis-deployment.yml');

      // Verify ConfigMap doesn't have database config
      const configMap = load(
        await fs.readFile(path.join(k8sPath, 'configmap.yml'), 'utf-8')
      ) as K8sConfigMap;
      expect(configMap.data['postgres-host']).toBeUndefined();
      expect(configMap.data['redis-host']).toBeUndefined();
    });
  });
});
