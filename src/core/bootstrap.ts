import { scanTokens } from "@infra/compiler/lexer/scanTokens.lexer";
import { parse } from "@infra/compiler/parser/parse.parser";
import { generate6502 } from "@infra/compiler/codegen/index.codegen";
import { analyzeProgram } from "@infra/compiler/semantic/scopeAnalyzer.semantic";
import { typecheckProgram } from "@infra/compiler/semantic/typeChecker.semantic";
import { logger } from "@infra/observability/logger";

function mapToRecord<V>(m: Map<string, V>): Record<string, V> {
    const out: Record<string, V> = {};
    for (const [k, v] of m.entries()) out[k] = v;
    return out;
}

export const bootstrap = () => {
    logger.info('[core:bootstrap] Starting Compiler');

    // multiple scopes with multiple declarations (example source kept for docs)
    const source = `  {
        int a
        boolean b
        string c
       a = 9
        b = true
        {
           print(a)
           print(b)
           b = false
           c = "hello world"
           int b
           b = 0
           {
              print(c)
              a = 1 + 2 + a
              {
                 print(b)
              }
           }
           b = a
           print(b)
        }
        print(b)
    



}$`;
    // example with a scope error
    // const source2 = '{ while (b == true) { int b } }$';
    // example with a type error
    // const source3 = '{ int a a = "1" print(a) }$';
    // const source4 = `{ string a a = "A!" print(a) }$`;
    const tokens = scanTokens(source);

    for (const token of tokens) {
        logger.info(`[core:bootstrap] Token: ${token.type} ${token.lexeme} ${token.literal}`);
    }

    const result = parse(tokens);
    logger.info(`[core:bootstrap] CST:\n${result.cstString}`);
    logger.info(`[core:bootstrap] AST: ${JSON.stringify(result.ast, null, 2)}`);

    const semantic = analyzeProgram(result.ast);
    const scopeIds = new Map(semantic.allScopes.map((s, i) => [s, i] as const));
    logger.info(`[core:bootstrap] Symbol tables created: ${semantic.allScopes.length}`);
    for (const scope of semantic.allScopes) {
        const id = scopeIds.get(scope);
        const parentId = scope.parent ? scopeIds.get(scope.parent) : null;
        logger.info(
            `[core:bootstrap] Scope ${id} (parent ${parentId ?? "none"}): ${JSON.stringify(
                mapToRecord(scope.symbols)
            )}`
        );
    }
    if (semantic.errors.length > 0) {
        for (const e of semantic.errors) {
            if (e.severity === "error") {
                logger.error(`[core:bootstrap] Semantic error: ${e.message} (line ${e.line}, column ${e.column})`);
            } else {
                logger.warn(`[core:bootstrap] Semantic warning: ${e.message} (line ${e.line}, column ${e.column})`);
            }
        }
    } else {
        logger.info(`[core:bootstrap] Semantic analysis: no scope errors`);
    }

    const types = typecheckProgram(result.ast, semantic.rootScope, semantic.blockToScope);
    if (types.errors.length > 0) {
        for (const e of types.errors) {
            if (e.severity === "error") {
                logger.error(`[core:bootstrap] Type error: ${e.message} (line ${e.line}, column ${e.column})`);
            } else {
                logger.warn(`[core:bootstrap] Type warning: ${e.message} (line ${e.line}, column ${e.column})`);
            }
        }
    } else {
        logger.info(`[core:bootstrap] Type check: no type errors`);
    }

    const semanticErrors = semantic.errors.filter((e) => e.severity === "error");
    const typeErrors = types.errors.filter((e) => e.severity === "error");
    if (semanticErrors.length === 0 && typeErrors.length === 0) {
        try {
            const image = generate6502(result.ast, semantic, types);
            logger.info(`[core:bootstrap] 6502 image (256 bytes, hex): ${image.hex}`);
        } catch (e) {
            logger.error(`[core:bootstrap] Codegen failed: ${String(e)}`);
        }
    }
};