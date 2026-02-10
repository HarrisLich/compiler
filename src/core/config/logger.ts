import { appConfig } from "./appConfig";
import pino from 'pino';
import type { LoggerConfig } from "./types";

export const loggerConfig: LoggerConfig = {
  level: appConfig.logger.level,
  base: {
    service: appConfig.logger.serviceName,
    env: appConfig.nodeEnv,
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard',
      ignore: 'pid,hostname',
    },
  },
};