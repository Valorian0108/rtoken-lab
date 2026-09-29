import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { createExperientialHandler } from "./api/experiential";
import { createQwenHandler } from "./api/qwen";
import { createStockCloseHandler } from "./api/stock-close";

export default defineConfig(({ mode }) => {
  const workspaceRoot = path.resolve(__dirname, "../..");
  const env = loadEnv(mode, workspaceRoot, "");
  const qwenBaseUrl = new URL(env.BITGET_QWEN_BASE_URL ?? env.QWEN_BASE_URL ?? "https://hackathon.bitgetops.com/v1");
  const qwenApiKey = env.BITGET_QWEN_API_KEY ?? env.QWEN_API_KEY ?? "";
  const experientialBaseUrl = new URL(env.EXPLABS_BASE_URL ?? "https://api.experientiallabs.ai/v1");
  const experientialApiKey = env.EXPLABS_API_KEY ?? "";
  const eodhdApiToken = env.EODHD_API_TOKEN ?? "";

  return {
  plugins: [react(), {
    name: "research-provider-dev-proxies",
    configureServer(server) {
      server.middlewares.use("/api/qwen", createQwenHandler({
        apiKey: qwenApiKey,
        baseUrl: `${qwenBaseUrl.origin}${qwenBaseUrl.pathname.replace(/\/$/, "")}`,
        model: env.BITGET_QWEN_MODEL ?? env.QWEN_MODEL,
      }));
      server.middlewares.use("/api/experiential", createExperientialHandler({
        apiKey: experientialApiKey,
        baseUrl: `${experientialBaseUrl.origin}${experientialBaseUrl.pathname.replace(/\/$/, "")}`,
      }));
      server.middlewares.use("/api/stock-close", createStockCloseHandler({ apiKey: eodhdApiToken || undefined }));
    },
  }],
  resolve: {
    alias: {
      "react/jsx-runtime": path.resolve(__dirname, "./src/jsx-runtime-shim.ts"),
      "@": path.resolve(__dirname, "./src"),
      "@rtoken-lab/core": path.resolve(__dirname, "../../packages/core/src"),
      "@rtoken-lab/mcp-client": path.resolve(__dirname, "../../packages/mcp-client/src"),
      "@rtoken-lab/ui": path.resolve(__dirname, "../../packages/ui/src"),
    },
  },
  optimizeDeps: {
    include: ["react", "react-dom", "react/jsx-runtime", "gsap", "jotai", "zod"],
  },
  build: {
    target: "es2022",
    minify: "esbuild",
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          "gsap-vendor": ["gsap"],
          "ui-vendor": ["@rtoken-lab/ui", "clsx", "tailwind-merge"],
          "state-vendor": ["jotai"],
        },
      },
    },
    commonjsOptions: {
      include: [/node_modules/, /gsap/],
      transformMixedEsModules: true,
    },
  },
  server: {
    port: 3000,
    host: true,
    proxy: {
      "/api/mcp": {
        target: "https://agent.bitget.com",
        changeOrigin: true,
        secure: true,
        rewrite: (requestPath) => requestPath.replace(/^\/api\/mcp/, "/mcp"),
      },
      "/api/rtoken-ticker": {
        target: "https://api.bitget.com",
        changeOrigin: true,
        secure: true,
        rewrite: (requestPath) => {
          const symbol = new URL(requestPath, "http://localhost").searchParams.get("symbol") ?? "RAAPLUSDT";
          return `/api/v3/market/tickers?category=SPOT&symbol=${encodeURIComponent(symbol)}`;
        },
      },
      "/api/rtoken-markets": {
        target: "https://api.bitget.com",
        changeOrigin: true,
        secure: true,
        rewrite: () => "/api/v3/market/instruments?category=SPOT",
      },
      "/api/rtoken-candles": {
        target: "https://api.bitget.com",
        changeOrigin: true,
        secure: true,
        rewrite: (requestPath) => {
          const params = new URL(requestPath, "http://localhost").searchParams;
          const symbol = params.get("symbol") ?? "RAAPLUSDT";
          const interval = params.get("interval") ?? "1H";
          const limit = params.get("limit") ?? "168";
          return `/api/v3/market/candles?${new URLSearchParams({ category: "SPOT", symbol, interval, limit })}`;
        },
      },
    },
  },
  define: {
    "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV ?? "development"),
  },
  };
});
