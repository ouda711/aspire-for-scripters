import { spawn, ChildProcess } from 'child_process';
import path from 'path';
import chalk from 'chalk';
import { DashboardServer } from '../dashboard/server.js';
import type { ServiceInfo } from '../dashboard/types.js';

/**
 * Dev command - Starts all services with monitoring
 */
export async function devCommand(projectPath?: string): Promise<void> {
  const cwd = projectPath || process.cwd();
  
  console.log(chalk.cyan('🚀 Starting development mode...'));
  console.log('');

  // Start dashboard server
  const dashboard = new DashboardServer(18888);
  await dashboard.start();

  // Detect project structure
  const services = await detectServices(cwd);

  if (services.length === 0) {
    console.log(chalk.yellow('⚠️  No services detected in this directory'));
    console.log(chalk.gray('   Make sure you run this command in an Aspire project directory'));
    await dashboard.stop();
    return;
  }

  console.log(chalk.green(`✓ Detected ${services.length} service(s)`));
  services.forEach(service => {
    console.log(chalk.gray(`  - ${service.name} (${service.type})`));
  });
  console.log('');

  // Start all services
  const processes: Map<string, ChildProcess> = new Map();

  for (const service of services) {
    try {
      const proc = await startService(service, cwd, dashboard);
      if (proc) {
        processes.set(service.name, proc);
      }
    } catch (error) {
      console.log(chalk.red(`✗ Failed to start ${service.name}: ${(error as Error).message}`));
    }
  }

  // Handle graceful shutdown
  const cleanup = async () => {
    console.log('');
    console.log(chalk.yellow('⏹  Stopping all services...'));
    
    for (const [name, proc] of processes.entries()) {
      try {
        proc.kill();
        console.log(chalk.gray(`  ✓ Stopped ${name}`));
      } catch (error) {
        console.log(chalk.red(`  ✗ Error stopping ${name}`));
      }
    }

    await dashboard.stop();
    process.exit(0);
  };

  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);

  console.log(chalk.green('✓ All services started'));
  console.log('');
  console.log(chalk.cyan('Press Ctrl+C to stop all services'));
}

/**
 * Detect services in the project
 */
async function detectServices(projectPath: string): Promise<ServiceInfo[]> {
  const services: ServiceInfo[] = [];
  const fs = await import('fs/promises');

  try {
    // Check for docker-compose.yml
    const dockerComposePath = path.join(projectPath, 'docker-compose.yml');
    try {
      await fs.access(dockerComposePath);
      // Parse docker-compose to find services
      const content = await fs.readFile(dockerComposePath, 'utf-8');
      const serviceMatches = content.match(/^  (\w+):/gm);
      if (serviceMatches) {
        serviceMatches.forEach(match => {
          const name = match.trim().replace(':', '');
          services.push({
            name,
            type: inferServiceType(name),
            status: 'stopped',
            startTime: new Date().toISOString(),
            lastUpdate: new Date().toISOString(),
          });
        });
      }
    } catch {
      // No docker-compose file
    }

    // Check for package.json (single service)
    if (services.length === 0) {
      const packageJsonPath = path.join(projectPath, 'package.json');
      try {
        await fs.access(packageJsonPath);
        const pkg = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'));
        services.push({
          name: pkg.name || 'app',
          type: 'app',
          status: 'stopped',
          port: 3000,
          startTime: new Date().toISOString(),
          lastUpdate: new Date().toISOString(),
        });
      } catch {
        // No package.json
      }
    }
  } catch (error) {
    console.error('Error detecting services:', error);
  }

  return services;
}

/**
 * Infer service type from name
 */
function inferServiceType(name: string): ServiceInfo['type'] {
  const lower = name.toLowerCase();
  if (lower.includes('postgres') || lower.includes('mysql') || lower.includes('mongo')) {
    return 'database';
  }
  if (lower.includes('redis')) {
    return 'cache';
  }
  if (lower.includes('rabbit') || lower.includes('kafka')) {
    return 'queue';
  }
  return 'app';
}

/**
 * Start a service
 */
async function startService(
  service: ServiceInfo,
  projectPath: string,
  dashboard: DashboardServer
): Promise<ChildProcess | null> {
  // Register service with dashboard
  dashboard.registerService({
    ...service,
    status: 'starting',
  });

  // Check if it's a database service (use docker-compose)
  if (service.type === 'database' || service.type === 'cache' || service.type === 'queue') {
    return startDockerService(service, projectPath, dashboard);
  }

  // Start application service
  return startAppService(service, projectPath, dashboard);
}

/**
 * Start docker service
 */
function startDockerService(
  service: ServiceInfo,
  projectPath: string,
  dashboard: DashboardServer
): ChildProcess | null {
  const proc = spawn('docker-compose', ['up', service.name], {
    cwd: projectPath,
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  proc.stdout?.on('data', (data) => {
    const log = data.toString();
    dashboard.addServiceLog(service.name, log);
  });

  proc.stderr?.on('data', (data) => {
    const log = data.toString();
    dashboard.addServiceLog(service.name, log);
  });

  proc.on('spawn', () => {
    dashboard.updateServiceStatus(service.name, 'running');
    console.log(chalk.green(`  ✓ Started ${service.name}`));
  });

  proc.on('error', (error) => {
    dashboard.updateServiceStatus(service.name, 'error');
    dashboard.addServiceLog(service.name, `Error: ${error.message}`);
  });

  proc.on('exit', (code) => {
    dashboard.updateServiceStatus(service.name, 'stopped');
    dashboard.addServiceLog(service.name, `Exited with code ${code}`);
  });

  return proc;
}

/**
 * Start application service
 */
function startAppService(
  service: ServiceInfo,
  projectPath: string,
  dashboard: DashboardServer
): ChildProcess | null {
  const fs = require('fs');
  const packageJsonPath = path.join(projectPath, 'package.json');
  
  if (!fs.existsSync(packageJsonPath)) {
    return null;
  }

  const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
  const devScript = pkg.scripts?.dev || pkg.scripts?.start;

  if (!devScript) {
    console.log(chalk.yellow(`  ⚠️  No dev or start script found for ${service.name}`));
    return null;
  }

  const proc = spawn('npm', ['run', 'dev'], {
    cwd: projectPath,
    stdio: ['ignore', 'pipe', 'pipe'],
    env: {
      ...process.env,
      PORT: service.port?.toString() || '3000',
    },
  });

  proc.stdout?.on('data', (data) => {
    const log = data.toString();
    dashboard.addServiceLog(service.name, log);
    
    // Detect port from logs
    const portMatch = log.match(/(?:port|PORT|listening on|started on).*?(\d{4,5})/i);
    if (portMatch) {
      const port = parseInt(portMatch[1]);
      const updatedService = {
        ...service,
        port,
        url: `http://localhost:${port}`,
      };
      dashboard.registerService(updatedService);
    }
  });

  proc.stderr?.on('data', (data) => {
    const log = data.toString();
    dashboard.addServiceLog(service.name, log);
  });

  proc.on('spawn', () => {
    dashboard.updateServiceStatus(service.name, 'running');
    console.log(chalk.green(`  ✓ Started ${service.name}`));
  });

  proc.on('error', (error) => {
    dashboard.updateServiceStatus(service.name, 'error');
    dashboard.addServiceLog(service.name, `Error: ${error.message}`);
  });

  proc.on('exit', (code) => {
    dashboard.updateServiceStatus(service.name, 'stopped');
    dashboard.addServiceLog(service.name, `Exited with code ${code}`);
  });

  return proc;
}
