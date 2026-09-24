import js from "@eslint/js";
import tseslint from "typescript-eslint";
import prettier from "eslint-plugin-prettier";

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...tseslint.configs.stylistic,
  {
    plugins: {
      prettier,
    },
    rules: {
      "prettier/prettier": "error",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }
      ],
      "@typescript-eslint/consistent-type-imports": "error",
      "@typescript-eslint/no-floating-promises": "warn"
    },
    ignores: ["node_modules", "dist", "build", "**/dist/**", "**/build/**", "*.config.*"]
  }
);