import { scanTokens } from "@infra/compiler/lexer/lexer";
import { logger } from "@infra/observability/logger";

export const bootstrap = () => {
    logger.info('[core:bootstrap] Starting Compiler');


    const source = 'print("hello world")$';
    const tokens = scanTokens(source);

    for (const token of tokens) {
        logger.info(`[core:bootstrap] Token: ${token.type} ${token.lexeme} ${token.literal}`);
    }
}