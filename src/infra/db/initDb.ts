import { Client, type ClientConfig } from 'pg';
import { logger } from '@infra/observability/logger';
import { config } from '@infra/config';

export const ensureDbExist = async () => {
  logger.info('[personal] 🔍 Checking database existence...');
  const { database: targetDb, ...rest } = config.pg.main;

  const client = new Client(rest as string | ClientConfig);
  await client.connect();

  const result = await client.query(
    `SELECT 1 FROM pg_database WHERE datname = $1`,
    [targetDb],
  );

  if (result.rowCount === 0) {
    logger.warn(`[personal] 📦 Database "${targetDb}" not found, creating...`);
    await client.query(`CREATE DATABASE ${targetDb}`);
    logger.info(`[personal] ✅ Database "${targetDb}" created.`);
  } else {
    logger.info(`[personal] ✅ Database "${targetDb}" already exists.`);
  }

  await client.end();
};