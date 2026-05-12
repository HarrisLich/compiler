import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { formatCompilerReport } from "@infra/compiler/formatCompilerReport.compiler";
import { generate6502 } from "@infra/compiler/codegen/index.codegen";
import { scanTokens } from "@infra/compiler/lexer/scanTokens.lexer";
import { parse } from "@infra/compiler/parser/parse.parser";
import { analyzeProgram } from "@infra/compiler/semantic/scopeAnalyzer.semantic";
import { typecheckProgram } from "@infra/compiler/semantic/typeChecker.semantic";

function usage(): void {
  console.error("Usage: compile:file <path-to-source.txt>");
  console.error("Example: yarn compile:file ./my-program.txt");
  console.error('         npm run compile:file -- ./my-program.txt');
}

const fileArg = process.argv[2];
if (!fileArg) {
  usage();
  process.exit(1);
}

const filePath = resolve(fileArg);
let source: string;
try {
  source = readFileSync(filePath, "utf8");
} catch (e) {
  console.error(`Could not read file: ${filePath}`);
  console.error(String(e));
  process.exit(1);
}

try {
  const tokens = scanTokens(source);
  const result = parse(tokens);
  const semantic = analyzeProgram(result.ast);
  const types = typecheckProgram(result.ast, semantic.rootScope, semantic.blockToScope);

  console.log(
    formatCompilerReport({
      tokens,
      cstString: result.cstString,
      ast: result.ast,
      semanticErrors: semantic.errors,
      typeErrors: types.errors,
    })
  );

  const hasSemanticErrors = semantic.errors.some((e) => e.severity === "error");
  const hasTypeErrors = types.errors.some((e) => e.severity === "error");

  console.log("");
  console.log("== CODEGEN (hex) ==");
  if (hasSemanticErrors || hasTypeErrors) {
    console.log("(skipped due to errors)");
    process.exitCode = 1;
  } else {
    const image = generate6502(result.ast, semantic, types);
    console.log(image.hex);
  }
} catch (e) {
  console.error(String(e));
  process.exit(1);
}
