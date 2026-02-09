import { logger } from "@infra/observability/logger";
import { createServer } from "./infra/http/server";

async function main() {
  try {
    const server = await createServer();
    const port = Number(process.env.PORT ?? 3000);
    server.listen(port, () => {
      logger.info(`🚀 Personal server listening on port ${port}`);
    });
  } catch (err) {
    logger.fatal({ err }, '💥 Server startup failed');
    process.exit(1);
  }
}

main();