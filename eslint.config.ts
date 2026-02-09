import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import { defineConfig } from "eslint/config";

export default defineConfig([
  tseslint.configs.recommended,
  {
    files: ["**/*.{js,mjs,cjs,ts,mts,cts}"],
    plugins: { js },
    extends: ["js/recommended"],
    languageOptions: {
      globals: {
        ...globals.node,    // <-- enables process, Buffer, __dirname, etc.
        ...globals.es2024,
      },
      ecmaVersion: "latest",
      sourceType: "module",
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      "no-unused-vars": "off",
      "no-undef": "off",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          "argsIgnorePattern": "^_",
          "varsIgnorePattern": "^_",
          "caughtErrorsIgnorePattern": "^_"
        }
      ]
    }
  },
  {
    ignores: ['dist/**', 'node_modules/**'],
  },
]);
