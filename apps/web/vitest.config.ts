import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@rtoken-lab/core": path.resolve(__dirname, "../../packages/core/src"),
      "@rtoken-lab/mcp-client": path.resolve(__dirname, "../../packages/mcp-client/src"),
      "@rtoken-lab/ui": path.resolve(__dirname, "../../packages/ui/src"),
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
    },
  },
});