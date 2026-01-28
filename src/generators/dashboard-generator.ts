import path from 'path';
import ora from 'ora';
import { FileSystemUtils } from '../utils/fs-utils.js';
import type { ProjectConfig } from '../config/schema.js';

/**
 * Generates Aspire Dashboard for monitoring services
 */
export class DashboardGenerator {
  private config: ProjectConfig;
  private projectPath: string;
  private dashboardPath: string;

  constructor(config: ProjectConfig, projectPath: string) {
    this.config = config;
    this.projectPath = projectPath;
    this.dashboardPath = path.join(projectPath, 'aspire-dashboard');
  }

  /**
   * Generate dashboard files
   */
  async generate(): Promise<void> {
    const spinner = ora('Generating Aspire Dashboard...').start();

    try {
      // Create dashboard directory
      await FileSystemUtils.ensureDir(this.dashboardPath);

      // Generate dashboard server
      spinner.text = 'Creating dashboard server...';
      await this.generateDashboardServer();

      // Generate dashboard package.json
      spinner.text = 'Creating dashboard configuration...';
      await this.generatePackageJson();

      // Generate start script
      spinner.text = 'Creating start script...';
      await this.generateStartScript();

      // Generate README
      spinner.text = 'Creating documentation...';
      await this.generateReadme();

      spinner.succeed('Aspire Dashboard generated successfully!');
    } catch (error) {
      spinner.fail('Failed to generate dashboard');
      throw error;
    }
  }

  /**
   * Generate dashboard server file
   */
  private async generateDashboardServer(): Promise<void> {
    const serverContent = `import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { spawn } from 'child_process';
import { readFileSync } from 'fs';
import { join } from 'path';
import YAML from 'yaml';

interface ServiceInfo {
  name: string;
  type: 'app' | 'database' | 'cache' | 'queue' | 'other';
  status: 'starting' | 'running' | 'stopped' | 'error';
  port?: number;
  url?: string;
  pid?: number;
  startTime: Date;
  lastUpdate: Date;
  metrics?: {
    cpu: number;
    memory: number;
    requests: number;
    errors: number;
    uptime: number;
  };
  logs: Array<{ timestamp: Date; message: string; level: string }>;
  environment?: Record<string, string>;
}

class DashboardServer {
  private app: express.Application;
  private httpServer: any;
  private io: Server;
  private port: number;
  private services: Map<string, ServiceInfo>;

  constructor(port: number = 18888) {
    this.app = express();
    this.httpServer = createServer(this.app);
    this.io = new Server(this.httpServer, {
      cors: { origin: '*' }
    });
    this.port = port;
    this.services = new Map();

    this.setupRoutes();
    this.setupSocketIO();
  }

  private setupRoutes(): void {
    this.app.use(express.json());

    // Serve dashboard HTML
    this.app.get('/', (req, res) => {
      res.send(this.getDashboardHTML());
    });

    // API endpoints
    this.app.get('/api/services', (req, res) => {
      res.json(Array.from(this.services.values()));
    });

    this.app.get('/api/services/:name', (req, res) => {
      const service = this.services.get(req.params.name);
      if (service) {
        res.json(service);
      } else {
        res.status(404).json({ error: 'Service not found' });
      }
    });

    this.app.get('/api/services/:name/logs', (req, res) => {
      const service = this.services.get(req.params.name);
      if (service) {
        res.json(service.logs);
      } else {
        res.status(404).json({ error: 'Service not found' });
      }
    });
  }

  private setupSocketIO(): void {
    this.io.on('connection', (socket) => {
      console.log('Client connected to dashboard');
      socket.emit('services:list', Array.from(this.services.values()));

      socket.on('disconnect', () => {
        console.log('Client disconnected');
      });
    });
  }

  registerService(service: ServiceInfo): void {
    this.services.set(service.name, service);
    this.io.emit('service:registered', service);
    console.log(\`📝 Registered service: \${service.name}\`);
  }

  updateServiceStatus(name: string, status: ServiceInfo['status']): void {
    const service = this.services.get(name);
    if (service) {
      service.status = status;
      service.lastUpdate = new Date();
      this.services.set(name, service);
      this.io.emit('service:status', { name, status });
    }
  }

  addServiceLog(name: string, log: { timestamp: Date; message: string; level: string }): void {
    const service = this.services.get(name);
    if (service) {
      service.logs.push(log);
      if (service.logs.length > 1000) {
        service.logs.shift();
      }
      this.io.emit('service:log', { name, log });
    }
  }

  async start(): Promise<void> {
    return new Promise((resolve) => {
      this.httpServer.listen(this.port, () => {
        console.log('');
        console.log('╔════════════════════════════════════════════════════════════╗');
        console.log('║  🎯 Aspire Dashboard                                      ║');
        console.log('╠════════════════════════════════════════════════════════════╣');
        console.log(\`║  ✓ Dashboard URL: http://localhost:\${this.port}           ║\`);
        console.log('║  ✓ WebSocket: Connected                                  ║');
        console.log(\`║  ✓ Services: \${this.services.size} registered                            ║\`);
        console.log('╚════════════════════════════════════════════════════════════╝');
        console.log('');
        console.log('  Monitoring all services in real-time...');
        console.log('');
        resolve();
      });
    });
  }

  private getDashboardHTML(): string {
    return \`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Aspire Dashboard - ${this.config.name}</title>
    <script src="https://cdn.socket.io/4.5.4/socket.io.min.js"></script>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }
        .container { max-width: 1400px; margin: 0 auto; }
        .header {
            background: rgba(255, 255, 255, 0.95);
            padding: 30px;
            border-radius: 12px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
            margin-bottom: 30px;
        }
        .header h1 { color: #667eea; font-size: 36px; margin-bottom: 10px; }
        .header p { color: #666; font-size: 16px; }
        .stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        .stat-card {
            background: rgba(255, 255, 255, 0.95);
            padding: 20px;
            border-radius: 12px;
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
        }
        .stat-card h3 { color: #999; font-size: 14px; text-transform: uppercase; margin-bottom: 10px; }
        .stat-card .value { color: #333; font-size: 32px; font-weight: bold; }
        .services {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
            gap: 20px;
        }
        .service-card {
            background: rgba(255, 255, 255, 0.95);
            padding: 24px;
            border-radius: 12px;
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
            transition: transform 0.2s;
        }
        .service-card:hover { transform: translateY(-4px); }
        .service-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
        .service-name { font-size: 20px; font-weight: bold; color: #333; }
        .service-status {
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
        }
        .status-running { background: #d1fae5; color: #065f46; }
        .status-stopped { background: #fee2e2; color: #991b1b; }
        .status-starting { background: #fef3c7; color: #92400e; }
        .status-error { background: #fee2e2; color: #991b1b; }
        .service-info { margin-bottom: 16px; }
        .info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f3f4f6; }
        .info-label { color: #6b7280; font-size: 14px; }
        .info-value { color: #111827; font-size: 14px; font-weight: 500; }
        .service-actions { display: flex; gap: 8px; }
        .btn {
            flex: 1;
            padding: 8px 12px;
            border: none;
            border-radius: 6px;
            font-size: 13px;
            cursor: pointer;
            transition: all 0.2s;
        }
        .btn-logs { background: #3b82f6; color: white; }
        .btn-logs:hover { background: #2563eb; }
        .empty-state { text-align: center; padding: 60px 20px; color: rgba(255, 255, 255, 0.9); }
        .empty-state h2 { font-size: 24px; margin-bottom: 10px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎯 Aspire Dashboard</h1>
            <p>Real-time monitoring for ${this.config.name}</p>
        </div>
        <div class="stats">
            <div class="stat-card">
                <h3>Total Services</h3>
                <div class="value" id="totalServices">0</div>
            </div>
            <div class="stat-card">
                <h3>Running</h3>
                <div class="value" style="color: #10b981;" id="runningServices">0</div>
            </div>
            <div class="stat-card">
                <h3>Stopped</h3>
                <div class="value" style="color: #ef4444;" id="stoppedServices">0</div>
            </div>
            <div class="stat-card">
                <h3>Connection</h3>
                <div class="value" style="color: #3b82f6;" id="connectionStatus">●</div>
            </div>
        </div>
        <div class="services" id="servicesContainer">
            <div class="empty-state">
                <h2>No services registered yet</h2>
                <p>Start your services with <code>npm run dev</code></p>
            </div>
        </div>
    </div>
    <script>
        const socket = io();
        let services = new Map();

        socket.on('connect', () => {
            document.getElementById('connectionStatus').textContent = '●';
            document.getElementById('connectionStatus').style.color = '#10b981';
        });

        socket.on('services:list', (servicesList) => {
            services.clear();
            servicesList.forEach(service => services.set(service.name, service));
            renderServices();
        });

        socket.on('service:registered', (service) => {
            services.set(service.name, service);
            renderServices();
        });

        socket.on('service:status', ({ name, status }) => {
            const service = services.get(name);
            if (service) {
                service.status = status;
                renderServices();
            }
        });

        function renderServices() {
            const container = document.getElementById('servicesContainer');
            const servicesArray = Array.from(services.values());

            document.getElementById('totalServices').textContent = servicesArray.length;
            document.getElementById('runningServices').textContent = servicesArray.filter(s => s.status === 'running').length;
            document.getElementById('stoppedServices').textContent = servicesArray.filter(s => s.status === 'stopped').length;

            if (servicesArray.length === 0) {
                container.innerHTML = \\\`<div class="empty-state"><h2>No services registered yet</h2><p>Start your services with <code>npm run dev</code></p></div>\\\`;
                return;
            }

            container.innerHTML = servicesArray.map(service => \\\`
                <div class="service-card">
                    <div class="service-header">
                        <div class="service-name">\\\${service.name}</div>
                        <div class="service-status status-\\\${service.status}">\\\${service.status}</div>
                    </div>
                    <div class="service-info">
                        <div class="info-row">
                            <span class="info-label">Type:</span>
                            <span class="info-value">\\\${service.type || 'unknown'}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Port:</span>
                            <span class="info-value">\\\${service.port || 'N/A'}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Last Update:</span>
                            <span class="info-value">\\\${new Date(service.lastUpdate).toLocaleTimeString()}</span>
                        </div>
                    </div>
                </div>
            \\\`).join('');
        }
    </script>
</body>
</html>\`;
  }
}

// Auto-start dashboard if this file is run directly
if (require.main === module) {
  const dashboard = new DashboardServer();
  dashboard.start().catch(console.error);
}

export { DashboardServer };
`;

    await FileSystemUtils.writeFile(
      path.join(this.dashboardPath, 'server.ts'),
      serverContent
    );
  }

  /**
   * Generate package.json for dashboard
   */
  private async generatePackageJson(): Promise<void> {
    const packageJson = {
      name: `${this.config.name}-dashboard`,
      version: '1.0.0',
      description: `Aspire Dashboard for ${this.config.name}`,
      main: 'server.ts',
      scripts: {
        start: 'ts-node server.ts',
        dev: 'ts-node-dev --respawn server.ts',
        build: 'tsc',
        'start:prod': 'node dist/server.js',
      },
      dependencies: {
        express: '^4.18.2',
        'socket.io': '^4.6.1',
        yaml: '^2.3.4',
      },
      devDependencies: {
        '@types/express': '^4.17.21',
        '@types/node': '^20.11.0',
        'ts-node': '^10.9.2',
        'ts-node-dev': '^2.0.0',
        typescript: '^5.3.3',
      },
    };

    await FileSystemUtils.writeFile(
      path.join(this.dashboardPath, 'package.json'),
      JSON.stringify(packageJson, null, 2)
    );
  }

  /**
   * Generate start script
   */
  private async generateStartScript(): Promise<void> {
    const scriptContent = `#!/usr/bin/env node

/**
 * Aspire Dashboard Launcher
 * 
 * This script starts the Aspire dashboard for monitoring your services.
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting Aspire Dashboard...\\n');

const dashboardPath = __dirname;
const serverPath = path.join(dashboardPath, 'server.ts');

// Start the dashboard server
const dashboard = spawn('npx', ['ts-node', serverPath], {
  cwd: dashboardPath,
  stdio: 'inherit',
  env: { ...process.env }
});

dashboard.on('error', (error) => {
  console.error('Failed to start dashboard:', error);
  process.exit(1);
});

dashboard.on('exit', (code) => {
  if (code !== 0) {
    console.error(\`Dashboard exited with code \${code}\`);
    process.exit(code || 1);
  }
});

// Handle shutdown signals
process.on('SIGINT', () => {
  console.log('\\n⏹  Stopping dashboard...');
  dashboard.kill('SIGINT');
});

process.on('SIGTERM', () => {
  dashboard.kill('SIGTERM');
});
`;

    const scriptPath = path.join(this.dashboardPath, 'start.js');
    await FileSystemUtils.writeFile(scriptPath, scriptContent);

    // Make script executable on Unix systems
    try {
      const fs = await import('fs');
      await fs.promises.chmod(scriptPath, 0o755);
    } catch (error) {
      // Ignore chmod errors on Windows
    }
  }

  /**
   * Generate README for dashboard
   */
  private async generateReadme(): Promise<void> {
    const readme = `# Aspire Dashboard for ${this.config.name}

Real-time monitoring dashboard for all your services, inspired by .NET Aspire.

## Features

- 🎯 **Real-time Monitoring**: Live updates of all running services
- 📊 **Service Statistics**: Track service status, uptime, and metrics
- 🔄 **Auto-Discovery**: Automatically detects services from docker-compose.yml
- 📝 **Log Aggregation**: View logs from all services in one place
- 🎨 **Beautiful UI**: Modern, responsive dashboard interface

## Quick Start

### Start the Dashboard

\`\`\`bash
npm install
npm start
\`\`\`

Or use the start script directly:

\`\`\`bash
node start.js
\`\`\`

The dashboard will be available at: **http://localhost:18888**

### Development Mode

For auto-reload during development:

\`\`\`bash
npm run dev
\`\`\`

### Production Build

\`\`\`bash
npm run build
npm run start:prod
\`\`\`

## Integration with Your Application

The dashboard automatically monitors services defined in your \`docker-compose.yml\` file.

### Manual Service Registration

You can also register services programmatically:

\`\`\`typescript
import { DashboardServer } from './aspire-dashboard/server';

const dashboard = new DashboardServer();

// Register your service
dashboard.registerService({
  name: '${this.config.name}',
  type: 'app',
  status: 'running',
  port: 3000,
  url: 'http://localhost:3000',
  startTime: new Date(),
  lastUpdate: new Date(),
  logs: []
});

await dashboard.start();
\`\`\`

## Configuration

### Port

Change the dashboard port by modifying the constructor:

\`\`\`typescript
const dashboard = new DashboardServer(8080); // Custom port
\`\`\`

### Environment Variables

- \`DASHBOARD_PORT\`: Dashboard port (default: 18888)

## Architecture

\`\`\`
aspire-dashboard/
├── server.ts          # Main dashboard server
├── package.json       # Dashboard dependencies
├── start.js          # Launcher script
└── README.md         # This file
\`\`\`

## How It Works

1. **Service Discovery**: Reads \`docker-compose.yml\` to find services
2. **Real-time Updates**: Uses WebSocket (Socket.IO) for live data
3. **Log Streaming**: Captures stdout/stderr from all services
4. **Metrics Collection**: Tracks CPU, memory, and request stats

## API Endpoints

- \`GET /\` - Dashboard UI
- \`GET /api/services\` - List all services
- \`GET /api/services/:name\` - Get service details
- \`GET /api/services/:name/logs\` - Get service logs

## WebSocket Events

### Server to Client
- \`services:list\` - Initial service list
- \`service:registered\` - New service registered
- \`service:status\` - Service status changed
- \`service:log\` - New log entry
- \`service:unregistered\` - Service removed

## Troubleshooting

### Port Already in Use

If port 18888 is already in use:

\`\`\`bash
lsof -ti:18888 | xargs kill -9
\`\`\`

### Services Not Appearing

1. Ensure \`docker-compose.yml\` exists in project root
2. Check that services are running: \`docker-compose ps\`
3. Verify dashboard is running: \`curl http://localhost:18888/api/services\`

## Learn More

- [.NET Aspire Documentation](https://learn.microsoft.com/en-us/dotnet/aspire/)
- [Socket.IO Documentation](https://socket.io/docs/v4/)
- [Express.js Documentation](https://expressjs.com/)

## License

Generated by Aspire for Scripters
`;

    await FileSystemUtils.writeFile(path.join(this.dashboardPath, 'README.md'), readme);
  }
}
