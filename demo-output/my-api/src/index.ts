import { createServer } from './server.js';

/**
 * Application entry point
 */
async function main() {
  try {
    const server = await createServer();
    
    const port = process.env.PORT || 3000;
    server.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

main();