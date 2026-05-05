import { scanTokens } from "@infra/compiler/lexer/lexer";
import { parse } from "@infra/compiler/parser/parser";
import { logger } from "@infra/observability/logger";

export const bootstrap = () => {
    logger.info('[core:bootstrap] Starting Compiler');


    const source = '{ boolean r r = (3 == 3) if (r == true) { print("r is true") } }$';
    const tokens = scanTokens(source);

    for (const token of tokens) {
        logger.info(`[core:bootstrap] Token: ${token.type} ${token.lexeme} ${token.literal}`);
    }

    const result = parse(tokens);
    logger.info(`[core:bootstrap] CST:\n${result.cstString}`);
    logger.info(`[core:bootstrap] AST: ${JSON.stringify(result.ast, null, 2)}`);
}