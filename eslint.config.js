import eslint from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist/**", "build/**", "node_modules/**", "coverage/**", "**/*.test.ts", "**/*.test.tsx"] },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["client/src/**/*.{ts,tsx}", "shared/**/*.ts", "lib/**/*.ts", "packages/**/*.ts"],
    languageOptions: {
      ecmaVersion: "latest",
      globals: {
        ...globals.browser,
        ...globals.node,
      },
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unused-vars": ["error", {
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_",
        caughtErrorsIgnorePattern: "^_",
      }],
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      "react-refresh/only-export-components": "off",
      "no-console": "off",
      "no-debugger": "error",
    },
  },
  {
    files: ["server/**/*.ts"],
    languageOptions: {
      ecmaVersion: "latest",
      globals: globals.node,
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unused-vars": ["error", {
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_",
      }],
      "no-console": "off",
      "no-debugger": "error",
    },
  },
);
