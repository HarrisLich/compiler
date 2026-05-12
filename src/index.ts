import "dotenv/config";
import express from "express";
import { z } from "zod";

import { generate6502 } from "@infra/compiler/codegen/index.codegen";
import { formatCompilerReport } from "@infra/compiler/formatCompilerReport.compiler";
import { scanTokens } from "@infra/compiler/lexer/scanTokens.lexer";
import { parse } from "@infra/compiler/parser/parse.parser";
import { analyzeProgram } from "@infra/compiler/semantic/scopeAnalyzer.semantic";
import { typecheckProgram } from "@infra/compiler/semantic/typeChecker.semantic";
import { logger } from "@infra/observability/logger";

const CompileRequest = z.object({
  source: z.string(),
});

const DEFAULT_SOURCE = `{
int a
int b
a = 0
b = 0
while (a != 3) {
  print(a)
  while (b != 3) {
    print(b)
    b = 1 + b
    if (b == 2) {
      print("there is no spoon")
    }
  }
  b = 0
  a = 1 + a
}
}
$`;

const app = express();
app.use(express.json({ limit: "1mb" }));

app.get("/", (_req, res) => {
  res.type("html").send(`<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Compiler UI</title>
    <style>
      body { font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial; margin: 16px; }
      .row { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; }
      textarea { width: 100%; min-height: 220px; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; font-size: 12px; padding: 10px; }
      .grid { display: grid; grid-template-columns: 1fr; gap: 12px; }
      @media (min-width: 1100px) { .grid { grid-template-columns: 1fr 1fr; } .grid3 { grid-template-columns: 1fr 1fr 1fr; } }
      button { padding: 8px 12px; cursor: pointer; }
      .muted { color: #666; font-size: 12px; }
      .error { color: #b00020; white-space: pre-wrap; }
    </style>
  </head>
  <body>
    <div class="row">
      <button id="compileBtn">Compile</button>
      <span class="muted">POSTs to <code>/api/compile</code></span>
      <span id="status" class="muted"></span>
    </div>

    <div class="grid grid3" style="margin-top: 12px;">
      <div>
        <div class="muted">Program input</div>
        <textarea id="program"></textarea>
      </div>
      <div>
        <div class="muted">Compiler output</div>
        <textarea id="compilerOutput" readonly></textarea>
      </div>
      <div>
        <div class="muted">Codegen output (hex)</div>
        <textarea id="codegenOutput" readonly></textarea>
      </div>
    </div>

    <div id="err" class="error" style="margin-top:12px;"></div>

    <script>
      const program = document.getElementById('program');
      const compilerOutput = document.getElementById('compilerOutput');
      const codegenOutput = document.getElementById('codegenOutput');
      const status = document.getElementById('status');
      const err = document.getElementById('err');
      const btn = document.getElementById('compileBtn');

      program.value = ${JSON.stringify(DEFAULT_SOURCE)};

      btn.addEventListener('click', async () => {
        err.textContent = '';
        status.textContent = 'Compiling...';
        btn.disabled = true;
        try {
          const resp = await fetch('/api/compile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ source: program.value }),
          });
          const data = await resp.json();
          if (!resp.ok) throw new Error(data?.error || 'Compile failed');
          compilerOutput.value = data.compilerOutput || '';
          codegenOutput.value = data.codegenHex || '';
          status.textContent = data.ok ? 'OK' : 'Done (with issues)';
        } catch (e) {
          err.textContent = String(e);
          status.textContent = 'Error';
        } finally {
          btn.disabled = false;
        }
      });
    </script>
  </body>
</html>`);
});

app.post("/api/compile", (req, res) => {
  const parsed = CompileRequest.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid request body." });
  }

  try {
    const tokens = scanTokens(parsed.data.source);
    const result = parse(tokens);
    const semantic = analyzeProgram(result.ast);
    const types = typecheckProgram(result.ast, semantic.rootScope, semantic.blockToScope);

    const compilerOutput = formatCompilerReport({
      tokens,
      cstString: result.cstString,
      ast: result.ast,
      semanticErrors: semantic.errors,
      typeErrors: types.errors,
    });

    const hasSemanticErrors = semantic.errors.some((e) => e.severity === "error");
    const hasTypeErrors = types.errors.some((e) => e.severity === "error");

    if (hasSemanticErrors || hasTypeErrors) {
      return res.json({ ok: false, compilerOutput, codegenHex: "" });
    }

    const image = generate6502(result.ast, semantic, types);
    return res.json({ ok: true, compilerOutput, codegenHex: image.hex });
  } catch (e) {
    return res.status(400).json({ error: String(e) });
  }
});

const port = Number(process.env.PORT ?? 3000);
app.listen(port, () => {
  logger.info(`[dev-ui] Listening on http://localhost:${port}`);
});
