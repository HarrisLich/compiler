import http from 'http';
import { initializeDb } from '@infra/db/knex';
import { buildApp } from './app';
import { logger } from '@infra/observability/logger';

/**
 * Creates and returns the HTTP server instance.
 * Handles database initialization and Express bootstrapping.
 */
export const createServer = async () => {
  const db = await initializeDb();

  // Verify DB connection
  try {
    await db.raw('select 1');
    logger.info('✅ Database connection established');
  } catch (err) {
    logger.error({ err }, '❌ Database connection failed');
    throw err;
  }

  const app = buildApp(db);
  const server = http.createServer(app);

  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    logger.info('🧹 Shutting down gracefully...');
    await db.destroy();
    logger.info('🗃️ Database connection closed');
    process.exit(0);
  });

  return server;
};