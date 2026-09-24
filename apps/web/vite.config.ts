import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const qwenBaseUrl = new URL(env.QWEN_BASE_URL ?? "https://hackathon.bitgetops.com/v1");

  return {
  plugins: [react()],
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
    include: ["react", "react-dom", "react/jsx-runtime", "three", "@react-three/fiber", "@react-three/drei", "gsap", "jotai", "zod"],
  },
  build: {
    target: "es2022",
    minify: "esbuild",
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          "three-vendor": ["three", "@react-three/fiber", "@react-three/drei"],
          "gsap-vendor": ["gsap"],
          "ui-vendor": ["@rtoken-lab/ui", "clsx", "tailwind-merge"],
          "state-vendor": ["jotai"],
        },
      },
    },
    commonjsOptions: {
      include: [/node_modules/, /three/, /@react-three/, /gsap/],
      transformMixedEsModules: true,
    },
  },
  server: {
    port: 3000,
    host: true,
    proxy: {
      "/api/qwen": {
        target: qwenBaseUrl.origin,
        changeOrigin: true,
        secure: true,
        rewrite: () => `${qwenBaseUrl.pathname.replace(/\/$/, "")}/responses`,
        headers: {
          Authorization: `Bearer ${env.QWEN_API_KEY ?? ""}`,
        },
      },
      "/api/mcp": {
        target: "https://agent.bitget.com/mcp",
        changeOrigin: true,
        secure: true,
      },
    },
  },
  define: {
    "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV ?? "development"),
  },
  };
});