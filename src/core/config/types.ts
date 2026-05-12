/** Shape accepted by `pino()` 
 * in `core/config/logger`. */
export interface LoggerConfig {
  level?: string;
  base?: Record<string, string>;
  timestamp?: (() => string) | false;
  transport?: {
    target: string;
    options?: Record<string, unknown>;
  };
}

export interface AppConfig {
  nodeEnv: string;
  logger: {
    level: string;
    serviceName: string;
  };
}
