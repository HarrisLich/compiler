import { config } from '@infra/config';
import pino from 'pino';

const loggerConfig = {
  level: config.logger.level ?? 'info',
  base: {
    service: config.logger.serviceName ?? 'personal',
    env: config.nodeEnv ?? "development",
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

export const logger = pino(loggerConfig);
