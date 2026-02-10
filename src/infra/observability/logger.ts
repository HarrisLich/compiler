import type { IncomingMessage, ServerResponse } from "http";
import { loggerConfig } from "@core/config/logger";
import pino from "pino";
import { pinoHttp } from "pino-http";

export const logger = pino(loggerConfig);

export const pinoHttpMiddleware = () =>
  pinoHttp({
    logger,
    autoLogging: true,
    serializers: {
      req(req: IncomingMessage) {
        return {
          method: req.method,
          url: req.url,
        };
      },
      res(res: ServerResponse) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
    customLogLevel(
      _req: IncomingMessage,
      res: ServerResponse,
      err: Error | undefined
    ) {
      if (res.statusCode) {
        if (res.statusCode >= 500 || err) return "error";
        if (res.statusCode >= 400) return "warn";
      }
      return "info";
    },
  });