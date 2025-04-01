import tseslint from "typescript-eslint";
import eslint, { } from "@eslint/js";

import eslintPluginPrettierRecommended from "eslint-plugin-prettier/recommended";
import reactPlugin from "eslint-plugin-react";

import reactRefresh from "eslint-plugin-react-refresh";
import globals from "globals";
import tsParser from "@typescript-eslint/parser";

// Import resolver for handling aliases and static assets
import { resolve as pathResolve } from "path";
import { fileURLToPath } from "url";

const __dirname = pathResolve(fileURLToPath(import.meta.url), "..");

export default tseslint.config(
  eslint.configs.recommended,
  tseslint.configs.recommended,
  eslintPluginPrettierRecommended,
  {
    rules: {
      "prettier/prettier": [
        "error",
        {
          "endOfLine": "auto"
        }
      ]
    }
  },
  reactPlugin.configs.flat.recommended,
  reactPlugin.configs.flat["jsx-runtime"],
  {
    ignores: ["dist/*"],
  },
  {
    ignores: ["*.cjs", "*.js"],
  },
  {
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      "func-style": [2, "expression"]
    },
  },
  {
    plugins: {
      "react-refresh": reactRefresh,
    },
    linterOptions: {
      reportUnusedDisableDirectives: true,
    },
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
      parser: tsParser,
      ecmaVersion: "latest",
      sourceType: "module",
      parserOptions: {
        project: "./tsconfig.json",
        tsconfigRootDir: __dirname,
      },
    },
    settings: {
      react: {
        version: "detect",
      },
    },
    rules: {
      "react-refresh/only-export-components": "warn",
      "@typescript-eslint/no-namespace": "off",
      "@typescript-eslint/ban-ts-comment": "off",
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": [
        "warn", // or "error"
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
    },
  }
);
