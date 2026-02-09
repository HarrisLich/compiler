import express from 'express';
import type { Knex } from 'knex';
import { mountGraphQL } from '../graphql/server';
import { pinoHttp } from 'pino-http';
import { logger } from "@infra/observability/logger";

export function buildApp(db: Knex) {
  const app = express();

  // Initialize pino-http middleware
  app.use(
    pinoHttp({
      logger,
      autoLogging: true, // disable if you want custom control
      serializers: {
        req(req) {
          return {
            method: req.method,
            url: req.url,
          };
        },
        res(res) {
          return {
            statusCode: res.statusCode,
          };
        },
      },
      customLogLevel(res, err) {
        if (res.statusCode) {
          if (res.statusCode >= 500 || err) return 'error';
          if (res.statusCode >= 400) return 'warn';
        }
        return 'info';
      },
    }),
  );

  // Core middleware
  app.use(express.json({ limit: '1mb' }));

  // Health endpoint
  app.get('/_internal/healthz', async (_req, res) => {
    try {
      await db.raw('select 1');
      res.status(200).json({ ok: true });
    } catch (err) {
      res.status(500).json({ ok: false, error: (err as Error).message });
    }
  });

  // GraphQL mount
  mountGraphQL(app, db);

  return app;
}