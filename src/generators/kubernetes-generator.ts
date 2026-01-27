import path from 'path';
import { dump } from 'js-yaml';
import ora from 'ora';
import { FileSystemUtils } from '../utils/fs-utils.js';
import type { ProjectConfig } from '../config/schema.js';
import { DeploymentBuilder } from '../orchestration/k8s/deployment-builder.js';
import { ServiceBuilder } from '../orchestration/k8s/service-builder.js';
import { ConfigMapBuilder } from '../orchestration/k8s/configmap-builder.js';
import { SecretBuilder } from '../orchestration/k8s/secret-builder.js';
import { IngressBuilder } from '../orchestration/k8s/ingress-builder.js';
import { HPABuilder } from '../orchestration/k8s/hpa-builder.js';
import { PVCBuilder } from '../orchestration/k8s/pvc-builder.js';

/**
 * Generates Kubernetes manifests
 */
export class KubernetesGenerator {
  private config: ProjectConfig;
  private projectPath: string;
  private k8sPath: string;

  constructor(config: ProjectConfig, projectPath: string) {
    this.config = config;
    this.projectPath = projectPath;
    this.k8sPath = path.join(projectPath, 'k8s');
  }

  /**
   * Generate all Kubernetes manifests
   */
  async generate(): Promise<void> {
    const spinner = ora('Generating Kubernetes manifests...').start();

    try {
      // Create k8s directory
      await FileSystemUtils.ensureDir(this.k8sPath);

      // Generate application resources
      spinner.text = 'Creating application deployment...';
      await this.generateAppResources();

      // Generate database resources
      if (this.config.sqlDatabase || this.config.nosqlDatabases.length > 0) {
        spinner.text = 'Creating database resources...';
        await this.generateDatabaseResources();
      }

      // Generate ingress
      spinner.text = 'Creating ingress configuration...';
      await this.generateIngress();

      // Generate HPA
      spinner.text = 'Creating autoscaler...';
      await this.generateHPA();

      // Generate README
      spinner.text = 'Creating deployment guide...';
      await this.generateReadme();

      spinner.succeed('Kubernetes manifests generated successfully!');
    } catch (error) {
      spinner.fail('Failed to generate Kubernetes manifests');
      throw error;
    }
  }

  /**
   * Generate application resources
   */
  private async generateAppResources(): Promise<void> {
    // Deployment
    const deployment = DeploymentBuilder.createAppDeployment(this.config);
    await this.writeManifest('deployment.yml', deployment);

    // Service
    const service = ServiceBuilder.createClusterIPService(
      this.config.name,
      80,
      3000,
      { app: this.config.name }
    );
    await this.writeManifest('service.yml', service);

    // ConfigMap
    const configMap = ConfigMapBuilder.createAppConfigMap(this.config);
    await this.writeManifest('configmap.yml', configMap);

    // Secret
    const secret = SecretBuilder.createAppSecret(this.config);
    await this.writeManifest('secret.yml', secret);
  }

  /**
   * Generate database resources
   */
  private async generateDatabaseResources(): Promise<void> {
    // PostgreSQL
    if (this.config.sqlDatabase === 'postgresql') {
      const deployment = DeploymentBuilder.createDatabaseDeployment(
        'postgres',
        'postgres:16-alpine',
        5432,
        { app: 'postgres', tier: 'database' }
      );
      await this.writeManifest('postgres-deployment.yml', deployment);

      const service = ServiceBuilder.createDatabaseService('postgres', 5432);
      await this.writeManifest('postgres-service.yml', service);

      const pvc = PVCBuilder.createDatabasePVC('postgres', '10Gi');
      await this.writeManifest('postgres-pvc.yml', pvc);

      const secret = SecretBuilder.createDatabaseSecret('postgres', 'postgresql');
      await this.writeManifest('postgres-secret.yml', secret);
    }

    // MySQL
    if (this.config.sqlDatabase === 'mysql') {
      const deployment = DeploymentBuilder.createDatabaseDeployment(
        'mysql',
        'mysql:8.0',
        3306,
        { app: 'mysql', tier: 'database' }
      );
      await this.writeManifest('mysql-deployment.yml', deployment);

      const service = ServiceBuilder.createDatabaseService('mysql', 3306);
      await this.writeManifest('mysql-service.yml', service);

      const pvc = PVCBuilder.createDatabasePVC('mysql', '10Gi');
      await this.writeManifest('mysql-pvc.yml', pvc);

      const secret = SecretBuilder.createDatabaseSecret('mysql', 'mysql');
      await this.writeManifest('mysql-secret.yml', secret);
    }

    // Redis
    if (this.config.nosqlDatabases.includes('redis')) {
      const deployment = DeploymentBuilder.createDatabaseDeployment(
        'redis',
        'redis:7-alpine',
        6379,
        { app: 'redis', tier: 'cache' }
      );
      await this.writeManifest('redis-deployment.yml', deployment);

      const service = ServiceBuilder.createDatabaseService('redis', 6379);
      await this.writeManifest('redis-service.yml', service);

      const pvc = PVCBuilder.createDatabasePVC('redis', '5Gi');
      await this.writeManifest('redis-pvc.yml', pvc);
    }

    // MongoDB
    if (this.config.nosqlDatabases.includes('mongodb')) {
      const deployment = DeploymentBuilder.createDatabaseDeployment(
        'mongodb',
        'mongo:7.0',
        27017,
        { app: 'mongodb', tier: 'database' }
      );
      await this.writeManifest('mongodb-deployment.yml', deployment);

      const service = ServiceBuilder.createDatabaseService('mongodb', 27017);
      await this.writeManifest('mongodb-service.yml', service);

      const pvc = PVCBuilder.createDatabasePVC('mongodb', '10Gi');
      await this.writeManifest('mongodb-pvc.yml', pvc);
    }
  }

  /**
   * Generate Ingress
   */
  private async generateIngress(): Promise<void> {
    const ingress = IngressBuilder.createAppIngress(
      this.config.name,
      `${this.config.name}.example.com`,
      this.config.name,
      80,
      false // TLS disabled by default
    );
    await this.writeManifest('ingress.yml', ingress);
  }

  /**
   * Generate HPA
   */
  private async generateHPA(): Promise<void> {
    const hpa = HPABuilder.createAppHPA(this.config.name, 2, 10, 70, 80);
    await this.writeManifest('hpa.yml', hpa);
  }

  /**
   * Generate README with deployment instructions
   */
  private async generateReadme(): Promise<void> {
    const readme = `# Kubernetes Deployment Guide

This directory contains Kubernetes manifests for deploying ${this.config.name}.

## Prerequisites

- Kubernetes cluster (v1.24+)
- kubectl configured
- Ingress controller (nginx recommended)
- Storage provisioner

## Quick Start

\`\`\`bash
# Apply all manifests
kubectl apply -f k8s/

# Check deployment status
kubectl get pods
kubectl get services
kubectl get ingress

# View logs
kubectl logs -f deployment/${this.config.name}
\`\`\`

## Resources

### Application
- **Deployment**: \`deployment.yml\` - Main application deployment
- **Service**: \`service.yml\` - ClusterIP service for internal access
- **ConfigMap**: \`configmap.yml\` - Application configuration
- **Secret**: \`secret.yml\` - Sensitive data (change default values!)
- **Ingress**: \`ingress.yml\` - External access configuration
- **HPA**: \`hpa.yml\` - Horizontal Pod Autoscaler

${this.config.sqlDatabase ? `### Database (${this.config.sqlDatabase})
- **Deployment**: \`${this.config.sqlDatabase}-deployment.yml\`
- **Service**: \`${this.config.sqlDatabase}-service.yml\`
- **PVC**: \`${this.config.sqlDatabase}-pvc.yml\`
- **Secret**: \`${this.config.sqlDatabase}-secret.yml\`
` : ''}

## Important Notes

⚠️ **Before deploying to production:**

1. **Update Secrets**: Change all passwords in \`secret.yml\` and \`*-secret.yml\`
2. **Update Ingress**: Change hostname in \`ingress.yml\` to your domain
3. **Configure Storage**: Set appropriate \`storageClassName\` in PVCs
4. **Review Resources**: Adjust CPU/memory limits based on your needs
5. **Enable TLS**: Configure TLS certificates for Ingress

## Deployment Steps

### 1. Create Namespace (Optional)
\`\`\`bash
kubectl create namespace ${this.config.name}
kubectl config set-context --current --namespace=${this.config.name}
\`\`\`

### 2. Apply Secrets (Update First!)
\`\`\`bash
kubectl apply -f k8s/secret.yml
${this.config.sqlDatabase ? `kubectl apply -f k8s/${this.config.sqlDatabase}-secret.yml` : ''}
\`\`\`

### 3. Apply ConfigMaps
\`\`\`bash
kubectl apply -f k8s/configmap.yml
\`\`\`

### 4. Create Storage
\`\`\`bash
${this.config.sqlDatabase ? `kubectl apply -f k8s/${this.config.sqlDatabase}-pvc.yml` : '# No persistent storage configured'}
\`\`\`

### 5. Deploy Database
\`\`\`bash
${this.config.sqlDatabase ? `kubectl apply -f k8s/${this.config.sqlDatabase}-deployment.yml
kubectl apply -f k8s/${this.config.sqlDatabase}-service.yml` : '# No database configured'}
\`\`\`

### 6. Deploy Application
\`\`\`bash
kubectl apply -f k8s/deployment.yml
kubectl apply -f k8s/service.yml
kubectl apply -f k8s/ingress.yml
kubectl apply -f k8s/hpa.yml
\`\`\`

### 7. Verify Deployment
\`\`\`bash
kubectl get all
kubectl describe deployment ${this.config.name}
kubectl logs -f deployment/${this.config.name}
\`\`\`

## Scaling

Manual scaling:
\`\`\`bash
kubectl scale deployment ${this.config.name} --replicas=5
\`\`\`

Auto-scaling is configured via HPA (2-10 replicas).

## Updating

Rolling update:
\`\`\`bash
kubectl set image deployment/${this.config.name} ${this.config.name}=${this.config.name}:v2
kubectl rollout status deployment/${this.config.name}
\`\`\`

Rollback:
\`\`\`bash
kubectl rollout undo deployment/${this.config.name}
\`\`\`

## Troubleshooting

\`\`\`bash
# Check pod status
kubectl get pods

# View pod logs
kubectl logs <pod-name>

# Describe pod for events
kubectl describe pod <pod-name>

# Execute commands in pod
kubectl exec -it <pod-name> -- /bin/sh

# Check resource usage
kubectl top pods
kubectl top nodes
\`\`\`

## Clean Up

\`\`\`bash
kubectl delete -f k8s/
\`\`\`
`;

    await FileSystemUtils.writeFile(path.join(this.k8sPath, 'README.md'), readme);
  }

  /**
   * Write manifest to file
   */
  private async writeManifest(filename: string, manifest: any): Promise<void> {
    const yamlContent = dump(manifest, {
      indent: 2,
      lineWidth: 120,
      noRefs: true,
    });

    await FileSystemUtils.writeFile(path.join(this.k8sPath, filename), yamlContent);
  }
}
