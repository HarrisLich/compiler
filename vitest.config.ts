import path from "path";
import { fileURLToPath } from "url";
import { defineConfig } from "vitest/config";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const src = path.resolve(__dirname, "src");

export default defineConfig({
  resolve: {
    alias: {
      "@infra": path.resolve(src, "infra"),
      "@shared": path.resolve(src, "shared"),
      "@core": path.resolve(src, "core"),
    },
  },
  test: {
    include: ["__tests__/**/*.test.ts", "src/**/*.test.ts"],
    exclude: ["node_modules", "dist", "coverage"],
  },
});
