import { scanTokens } from "@infra/compiler/lexer/lexer";
import { logger } from "@infra/observability/logger";
import { Tree } from "@infra/structs/tree/Tree";
export const bootstrap = () => {
    logger.info('[core:bootstrap] Starting Compiler');


    const source = 'print("hello world")$';
    const tokens = scanTokens(source);

    for (const token of tokens) {
        logger.info(`[core:bootstrap] Token: ${token.type} ${token.lexeme} ${token.literal}`);
    }

    // Test Tree: Root -> Expr(Term(Factor(a))), Op(+), Term(Factor(2))
    const tree = Tree();
    tree.addNode("Root", "branch");
    tree.addNode("Expr", "branch");
    tree.addNode("Term", "branch");
    tree.addNode("Factor", "branch");
    tree.addNode("a", "leaf");
    tree.endChildren();
    tree.endChildren();
    tree.endChildren();
    tree.addNode("Op", "branch");
    tree.addNode("+", "leaf");
    tree.endChildren();
    tree.addNode("Term", "branch");
    tree.addNode("Factor", "branch");
    tree.addNode("2", "leaf");
    tree.endChildren();
    tree.endChildren();
    tree.endChildren();
    logger.info(`[core:bootstrap] Tree:\n${tree.toString()}`);
}