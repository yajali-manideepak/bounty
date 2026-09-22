const app = require('./app');
const env = require('./config/env');

const server = app.listen(env.port, () => {
  console.log(`[Server] BugHunt Pro API running on port ${env.port} (${env.nodeEnv})`);
  console.log(`[Server] Health check: http://localhost:${env.port}/api/health`);
});

process.on('SIGTERM', () => {
  console.log('[Server] SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('[Server] Process terminated.');
  });
});
