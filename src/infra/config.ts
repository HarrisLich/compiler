import dotenv from "dotenv";
import fs from 'fs';
import path from 'path';

// Determine environment
const env = process.env.NODE_ENV ?? 'local';
const envFile = `.env.${env}`;
const envPath = path.resolve(process.cwd(), envFile);

// Load environment-specific file if it exists
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
  console.info(`[personal] Loaded environment file: ${envFile}`);
} else {
  dotenv.config(); // fallback to default .env
  console.warn(`[personal] No specific ${envFile} found, using default .env`);
}

export const config = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 3000),
  pg: {
    databaseUrl: process.env.DATABASE_URL,
    main: {
      host: process.env.PG_HOST ?? 'localhost',
      port: Number(process.env.PG_PORT ?? 5432),
      user: process.env.PG_USER ?? 'postgres',
      password: process.env.PG_PASSWORD ?? 'postgres',
      database: process.env.PG_DATABASE ?? 'postgres',
      ssl: (process.env.PG_SSL ?? 'false') === 'true',
    }
  },
  logger: {
    level: process.env.LOGGER_LEVEL ?? 'info',
    serviceName: process.env.SERVICE_NAME ?? 'personal',
  }
};
