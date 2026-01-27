import { dump } from 'js-yaml';
import fs from 'fs-extra';
import path from 'path';
import type { ProjectConfig } from '../config/schema.js';
import { ServiceRegistry } from '../orchestration/service-registry.js';
import { DependencyResolver } from '../orchestration/dependency-resolver.js';
import { NetworkBuilder } from '../orchestration/network-builder.js';

/**
 * Docker Compose generator
 */
export class DockerComposeGenerator {
  constructor(
    private config: ProjectConfig,
    private projectPath: string,
  ) {}

  /**
   * Generate Docker Compose files
   */
  async generate(): Promise<void> {
    await this.generateDockerCompose();
    await this.generateEnvFile();
    await this.generateDockerignore();
  }

  /**
   * Generate docker-compose.yml
   */
  private async generateDockerCompose(): Promise<void> {
    // Get all services
    const services = ServiceRegistry.getServices(this.config);

    // Sort services by dependencies
    const sortedServices = DependencyResolver.sortByDependencies(services);

    // Build docker-compose structure
    const compose = {
      version: '3.8',
      services: this.buildServicesSection(sortedServices),
      networks: NetworkBuilder.getNetworks(),
      volumes: this.buildVolumesSection(sortedServices),
    };

    // Convert to YAML
    const yaml = dump(compose, {
      indent: 2,
      lineWidth: -1,
      noRefs: true,
    });

    // Write to file
    const filePath = path.join(this.projectPath, 'docker-compose.yml');
    await fs.writeFile(filePath, yaml);
  }

  /**
   * Build services section
   */
  private buildServicesSection(services: any[]): Record<string, any> {
    const servicesSection: Record<string, any> = {};

    for (const service of services) {
      const { name, ...serviceConfig } = service;
      servicesSection[name] = serviceConfig;
    }

    return servicesSection;
  }

  /**
   * Build volumes section
   */
  private buildVolumesSection(services: any[]): Record<string, any> | undefined {
    const volumes = new Set<string>();

    for (const service of services) {
      if (service.volumes) {
        for (const volume of service.volumes) {
          // Extract named volumes (format: volume_name:/path)
          if (volume.includes(':') && !volume.startsWith('.') && !volume.startsWith('/')) {
            const volumeName = volume.split(':')[0];
            volumes.add(volumeName);
          }
        }
      }
    }

    if (volumes.size === 0) {
      return undefined;
    }

    const volumesSection: Record<string, any> = {};
    for (const volume of volumes) {
      volumesSection[volume] = {};
    }

    return volumesSection;
  }

  /**
   * Generate .env file
   */
  private async generateEnvFile(): Promise<void> {
    const envVars: string[] = [
      '# Application',
      `NODE_ENV=development`,
      `PORT=3000`,
      ``,
    ];

    // Add database variables
    if (this.config.sqlDatabase === 'postgresql') {
      envVars.push(
        '# PostgreSQL',
        'POSTGRES_HOST=postgres',
        'POSTGRES_PORT=5432',
        'POSTGRES_USER=postgres',
        'POSTGRES_PASSWORD=postgres',
        'POSTGRES_DB=myapp',
        '',
      );
    } else if (this.config.sqlDatabase === 'mysql') {
      envVars.push(
        '# MySQL',
        'MYSQL_HOST=mysql',
        'MYSQL_PORT=3306',
        'MYSQL_ROOT_PASSWORD=root',
        'MYSQL_DATABASE=myapp',
        'MYSQL_USER=user',
        'MYSQL_PASSWORD=password',
        '',
      );
    }

    // Add Redis variables
    if (this.config.nosqlDatabases?.includes('redis')) {
      envVars.push('# Redis', 'REDIS_HOST=redis', 'REDIS_PORT=6379', '');
    }

    // Add MongoDB variables
    if (this.config.nosqlDatabases?.includes('mongodb')) {
      envVars.push(
        '# MongoDB',
        'MONGODB_HOST=mongodb',
        'MONGODB_PORT=27017',
        'MONGODB_USER=admin',
        'MONGODB_PASSWORD=password',
        `MONGODB_URI=mongodb://admin:password@mongodb:27017/myapp?authSource=admin`,
        '',
      );
    }

    // Add RabbitMQ variables
    if (this.config.includeMessageQueue && this.config.messageQueue === 'rabbitmq') {
      envVars.push(
        '# RabbitMQ',
        'RABBITMQ_HOST=rabbitmq',
        'RABBITMQ_PORT=5672',
        'RABBITMQ_MANAGEMENT_PORT=15672',
        'RABBITMQ_USER=guest',
        'RABBITMQ_PASSWORD=guest',
        '',
      );
    }

    // Write to .env file
    const filePath = path.join(this.projectPath, '.env');
    await fs.writeFile(filePath, envVars.join('\n'));
  }

  /**
   * Generate .dockerignore file
   */
  private async generateDockerignore(): Promise<void> {
    const ignorePatterns = [
      'node_modules',
      'npm-debug.log',
      '.git',
      '.gitignore',
      '.env',
      '.env.local',
      '.env.*.local',
      'dist',
      'build',
      'coverage',
      '.vscode',
      '.idea',
      '*.log',
      '.DS_Store',
      'Thumbs.db',
    ];

    const filePath = path.join(this.projectPath, '.dockerignore');
    await fs.writeFile(filePath, ignorePatterns.join('\n'));
  }
}
