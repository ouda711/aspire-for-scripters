import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';
import type { ServiceInfo, ServiceStatus } from './types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Aspire Dashboard Server
 * Provides a web-based monitoring interface for all services
 */
export class DashboardServer {
  private app: express.Application;
  private httpServer: any;
  private io: SocketIOServer;
  private services: Map<string, ServiceInfo> = new Map();
  private port: number;

  constructor(port: number = 18888) {
    this.port = port;
    this.app = express();
    this.httpServer = createServer(this.app);
    this.io = new SocketIOServer(this.httpServer, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST'],
      },
    });

    this.setupRoutes();
    this.setupSocketIO();
  }

  /**
   * Setup Express routes
   */
  private setupRoutes(): void {
    // Serve static dashboard UI
    this.app.use(express.static(path.join(__dirname, 'public')));
    this.app.use(express.json());

    // API: Get all services
    this.app.get('/api/services', (req, res) => {
      const servicesList = Array.from(this.services.values());
      res.json(servicesList);
    });

    // API: Get specific service
    this.app.get('/api/services/:name', (req, res) => {
      const service = this.services.get(req.params.name);
      if (service) {
        res.json(service);
      } else {
        res.status(404).json({ error: 'Service not found' });
      }
    });

    // API: Get service logs
    this.app.get('/api/services/:name/logs', (req, res) => {
      const service = this.services.get(req.params.name);
      if (service) {
        res.json({ logs: service.logs || [] });
      } else {
        res.status(404).json({ error: 'Service not found' });
      }
    });

    // API: Restart service
    this.app.post('/api/services/:name/restart', (req, res) => {
      const service = this.services.get(req.params.name);
      if (service) {
        this.emit('service:restart', service.name);
        res.json({ success: true, message: `Restart signal sent to ${service.name}` });
      } else {
        res.status(404).json({ error: 'Service not found' });
      }
    });

    // API: Stop service
    this.app.post('/api/services/:name/stop', (req, res) => {
      const service = this.services.get(req.params.name);
      if (service) {
        this.emit('service:stop', service.name);
        res.json({ success: true, message: `Stop signal sent to ${service.name}` });
      } else {
        res.status(404).json({ error: 'Service not found' });
      }
    });

    // Dashboard UI
    this.app.get('/', (req, res) => {
      res.send(this.getDashboardHTML());
    });

    // Health check
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'ok',
        services: this.services.size,
        uptime: process.uptime(),
      });
    });
  }

  /**
   * Setup Socket.IO for real-time updates
   */
  private setupSocketIO(): void {
    this.io.on('connection', (socket) => {
      console.log(chalk.green('✓ Dashboard client connected'));

      // Send current services state
      socket.emit('services:list', Array.from(this.services.values()));

      socket.on('disconnect', () => {
        console.log(chalk.yellow('✗ Dashboard client disconnected'));
      });
    });
  }

  /**
   * Register a service
   */
  registerService(service: ServiceInfo): void {
    this.services.set(service.name, service);
    this.io.emit('service:registered', service);
    console.log(chalk.blue(`📝 Registered service: ${service.name}`));
  }

  /**
   * Update service status
   */
  updateServiceStatus(name: string, status: ServiceStatus): void {
    const service = this.services.get(name);
    if (service) {
      service.status = status;
      service.lastUpdate = new Date().toISOString();
      this.services.set(name, service);
      this.io.emit('service:status', { name, status });
    }
  }

  /**
   * Add log entry to service
   */
  addServiceLog(name: string, log: string): void {
    const service = this.services.get(name);
    if (service) {
      if (!service.logs) service.logs = [];
      service.logs.push({
        timestamp: new Date().toISOString(),
        message: log,
      });
      
      // Keep only last 1000 logs
      if (service.logs.length > 1000) {
        service.logs = service.logs.slice(-1000);
      }

      this.io.emit('service:log', { name, log });
    }
  }

  /**
   * Update service metrics
   */
  updateServiceMetrics(name: string, metrics: any): void {
    const service = this.services.get(name);
    if (service) {
      service.metrics = metrics;
      this.io.emit('service:metrics', { name, metrics });
    }
  }

  /**
   * Remove a service
   */
  unregisterService(name: string): void {
    this.services.delete(name);
    this.io.emit('service:unregistered', name);
    console.log(chalk.gray(`📝 Unregistered service: ${name}`));
  }

  /**
   * Emit custom event
   */
  emit(event: string, data: any): void {
    this.io.emit(event, data);
  }

  /**
   * Start the dashboard server
   */
  async start(): Promise<void> {
    return new Promise((resolve) => {
      this.httpServer.listen(this.port, () => {
        console.log('');
        console.log(chalk.cyan('╔════════════════════════════════════════════════════════════╗'));
        console.log(chalk.cyan('║') + chalk.bold('  🎯 Aspire Dashboard                                      ') + chalk.cyan('║'));
        console.log(chalk.cyan('╠════════════════════════════════════════════════════════════╣'));
        console.log(chalk.cyan('║') + `  ${chalk.green('✓')} Dashboard URL: ${chalk.underline(`http://localhost:${this.port}`)}           ` + chalk.cyan('║'));
        console.log(chalk.cyan('║') + `  ${chalk.green('✓')} WebSocket: Connected                                  ` + chalk.cyan('║'));
        console.log(chalk.cyan('║') + `  ${chalk.green('✓')} Services: ${this.services.size} registered                            ` + chalk.cyan('║'));
        console.log(chalk.cyan('╚════════════════════════════════════════════════════════════╝'));
        console.log('');
        console.log(chalk.yellow('  Monitoring all services in real-time...'));
        console.log('');
        resolve();
      });
    });
  }

  /**
   * Stop the dashboard server
   */
  async stop(): Promise<void> {
    return new Promise((resolve) => {
      this.httpServer.close(() => {
        console.log(chalk.gray('Dashboard server stopped'));
        resolve();
      });
    });
  }

  /**
   * Get dashboard HTML
   */
  private getDashboardHTML(): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Aspire Dashboard</title>
    <script src="https://cdn.socket.io/4.5.4/socket.io.min.js"></script>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }
        .container {
            max-width: 1400px;
            margin: 0 auto;
        }
        .header {
            background: rgba(255, 255, 255, 0.95);
            padding: 30px;
            border-radius: 12px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
            margin-bottom: 30px;
        }
        .header h1 {
            color: #667eea;
            font-size: 36px;
            margin-bottom: 10px;
        }
        .header p {
            color: #666;
            font-size: 16px;
        }
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
        .stat-card h3 {
            color: #999;
            font-size: 14px;
            text-transform: uppercase;
            margin-bottom: 10px;
        }
        .stat-card .value {
            color: #333;
            font-size: 32px;
            font-weight: bold;
        }
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
            transition: transform 0.2s, box-shadow 0.2s;
        }
        .service-card:hover {
            transform: translateY(-4px);
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
        }
        .service-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 16px;
        }
        .service-name {
            font-size: 20px;
            font-weight: bold;
            color: #333;
        }
        .service-status {
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
        }
        .status-running { background: #10b981; color: white; }
        .status-stopped { background: #ef4444; color: white; }
        .status-starting { background: #f59e0b; color: white; }
        .status-error { background: #dc2626; color: white; }
        .service-info {
            display: grid;
            gap: 12px;
            margin-bottom: 16px;
        }
        .info-row {
            display: flex;
            justify-content: space-between;
            font-size: 14px;
        }
        .info-label {
            color: #999;
        }
        .info-value {
            color: #333;
            font-weight: 500;
        }
        .service-actions {
            display: flex;
            gap: 10px;
        }
        .btn {
            padding: 8px 16px;
            border: none;
            border-radius: 6px;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            transition: opacity 0.2s;
        }
        .btn:hover {
            opacity: 0.8;
        }
        .btn-restart {
            background: #3b82f6;
            color: white;
            flex: 1;
        }
        .btn-stop {
            background: #ef4444;
            color: white;
            flex: 1;
        }
        .btn-logs {
            background: #8b5cf6;
            color: white;
            flex: 1;
        }
        .logs-modal {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            z-index: 1000;
            padding: 20px;
        }
        .logs-content {
            background: #1e1e1e;
            color: #d4d4d4;
            border-radius: 12px;
            padding: 24px;
            max-width: 900px;
            max-height: 80vh;
            margin: 50px auto;
            overflow-y: auto;
            font-family: 'Courier New', monospace;
        }
        .logs-header {
            display: flex;
            justify-content: space-between;
            margin-bottom: 20px;
            padding-bottom: 16px;
            border-bottom: 1px solid #333;
        }
        .logs-header h2 {
            color: #fff;
        }
        .close-btn {
            background: #ef4444;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 6px;
            cursor: pointer;
        }
        .log-entry {
            padding: 8px 0;
            border-bottom: 1px solid #333;
            font-size: 13px;
        }
        .log-timestamp {
            color: #888;
            margin-right: 12px;
        }
        .empty-state {
            text-align: center;
            padding: 60px 20px;
            color: rgba(255, 255, 255, 0.9);
        }
        .empty-state h2 {
            font-size: 24px;
            margin-bottom: 10px;
        }
        .pulse {
            animation: pulse 2s ease-in-out infinite;
        }
        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎯 Aspire Dashboard</h1>
            <p>Real-time monitoring for all your services</p>
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
                <p>Start your application with <code>aspire-for-scripters dev</code></p>
                <div class="pulse" style="margin-top: 20px;">⏳</div>
            </div>
        </div>
    </div>

    <div class="logs-modal" id="logsModal">
        <div class="logs-content">
            <div class="logs-header">
                <h2 id="logsTitle">Service Logs</h2>
                <button class="close-btn" onclick="closeLogs()">Close</button>
            </div>
            <div id="logsContent"></div>
        </div>
    </div>

    <script>
        const socket = io();
        let services = new Map();

        // Socket.IO connection
        socket.on('connect', () => {
            document.getElementById('connectionStatus').textContent = '●';
            document.getElementById('connectionStatus').style.color = '#10b981';
        });

        socket.on('disconnect', () => {
            document.getElementById('connectionStatus').textContent = '○';
            document.getElementById('connectionStatus').style.color = '#ef4444';
        });

        // Service events
        socket.on('services:list', (servicesList) => {
            services.clear();
            servicesList.forEach(service => {
                services.set(service.name, service);
            });
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
                services.set(name, service);
                renderServices();
            }
        });

        socket.on('service:log', ({ name, log }) => {
            const service = services.get(name);
            if (service) {
                if (!service.logs) service.logs = [];
                service.logs.push(log);
                services.set(name, service);
            }
        });

        socket.on('service:unregistered', (name) => {
            services.delete(name);
            renderServices();
        });

        // Render services
        function renderServices() {
            const container = document.getElementById('servicesContainer');
            const servicesArray = Array.from(services.values());

            // Update stats
            document.getElementById('totalServices').textContent = servicesArray.length;
            document.getElementById('runningServices').textContent = 
                servicesArray.filter(s => s.status === 'running').length;
            document.getElementById('stoppedServices').textContent = 
                servicesArray.filter(s => s.status === 'stopped').length;

            if (servicesArray.length === 0) {
                container.innerHTML = \`
                    <div class="empty-state">
                        <h2>No services registered yet</h2>
                        <p>Start your application with <code>aspire-for-scripters dev</code></p>
                        <div class="pulse" style="margin-top: 20px;">⏳</div>
                    </div>
                \`;
                return;
            }

            container.innerHTML = servicesArray.map(service => \`
                <div class="service-card">
                    <div class="service-header">
                        <div class="service-name">\${service.name}</div>
                        <div class="service-status status-\${service.status}">\${service.status}</div>
                    </div>
                    <div class="service-info">
                        <div class="info-row">
                            <span class="info-label">Type:</span>
                            <span class="info-value">\${service.type || 'unknown'}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Port:</span>
                            <span class="info-value">\${service.port || 'N/A'}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">URL:</span>
                            <span class="info-value">
                                \${service.url ? \`<a href="\${service.url}" target="_blank" style="color: #3b82f6;">Open</a>\` : 'N/A'}
                            </span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Last Update:</span>
                            <span class="info-value">\${new Date(service.lastUpdate).toLocaleTimeString()}</span>
                        </div>
                    </div>
                    <div class="service-actions">
                        <button class="btn btn-logs" onclick="viewLogs('\${service.name}')">
                            📋 Logs
                        </button>
                        <button class="btn btn-restart" onclick="restartService('\${service.name}')">
                            🔄 Restart
                        </button>
                        <button class="btn btn-stop" onclick="stopService('\${service.name}')">
                            ⏹ Stop
                        </button>
                    </div>
                </div>
            \`).join('');
        }

        // Actions
        async function restartService(name) {
            try {
                const response = await fetch(\`/api/services/\${name}/restart\`, { method: 'POST' });
                const data = await response.json();
                alert(data.message);
            } catch (error) {
                alert('Failed to restart service: ' + error.message);
            }
        }

        async function stopService(name) {
            if (confirm(\`Stop service "\${name}"?\`)) {
                try {
                    const response = await fetch(\`/api/services/\${name}/stop\`, { method: 'POST' });
                    const data = await response.json();
                    alert(data.message);
                } catch (error) {
                    alert('Failed to stop service: ' + error.message);
                }
            }
        }

        async function viewLogs(name) {
            try {
                const response = await fetch(\`/api/services/\${name}/logs\`);
                const data = await response.json();
                
                document.getElementById('logsTitle').textContent = \`Logs: \${name}\`;
                const logsContent = document.getElementById('logsContent');
                
                if (data.logs && data.logs.length > 0) {
                    logsContent.innerHTML = data.logs.map(log => \`
                        <div class="log-entry">
                            <span class="log-timestamp">\${new Date(log.timestamp).toLocaleTimeString()}</span>
                            <span>\${log.message}</span>
                        </div>
                    \`).join('');
                } else {
                    logsContent.innerHTML = '<div class="log-entry">No logs available</div>';
                }
                
                document.getElementById('logsModal').style.display = 'block';
            } catch (error) {
                alert('Failed to fetch logs: ' + error.message);
            }
        }

        function closeLogs() {
            document.getElementById('logsModal').style.display = 'none';
        }

        // Close modal on outside click
        document.getElementById('logsModal').onclick = function(event) {
            if (event.target === this) {
                closeLogs();
            }
        };

        // Initial load
        fetch('/api/services')
            .then(res => res.json())
            .then(servicesList => {
                services.clear();
                servicesList.forEach(service => {
                    services.set(service.name, service);
                });
                renderServices();
            });
    </script>
</body>
</html>
    `;
  }
}
