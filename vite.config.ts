import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

// Resolve a stable project root even when this config is loaded as middleware
// by a Node server or when run directly from the client directory.
const PROJECT_ROOT = path.resolve(import.meta.dirname);
const CLIENT_ROOT = path.resolve(PROJECT_ROOT, "client");

// Allow overriding dev ports/hosts via env (helpful in CI/remote editors).
const DEV_PORT = Number(process.env.VITE_DEV_SERVER_PORT || process.env.PORT || 3000);
const HMR_HOST = process.env.HMR_HOST || "localhost";
const isCodespace = Boolean(
  process.env.CODESPACE_NAME && process.env.GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN,
);
const HMR_PROTOCOL = process.env.HMR_PROTOCOL || (isCodespace ? "wss" : "ws");
const HMR_PUBLIC_HOST = isCodespace
  ? `${process.env.CODESPACE_NAME}-${DEV_PORT}.${process.env.GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN}`
  : HMR_HOST;

export default defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...(process.env.NODE_ENV !== "production" &&
    process.env.REPL_ID !== undefined
      ? [
          await import("@replit/vite-plugin-cartographer").then((m) =>
            m.cartographer(),
          ),
          await import("@replit/vite-plugin-dev-banner").then((m) =>
            m.devBanner(),
          ),
        ]
      : []),
  ],
  resolve: {
    alias: {
      // use a stable client root so imports like "@/..." resolve whether
      // Vite runs directly or as middleware from the Node server.
      "@": path.resolve(CLIENT_ROOT, "src"),
      "@shared": path.resolve(PROJECT_ROOT, "shared"),
      "@assets": path.resolve(PROJECT_ROOT, "attached_assets"),
    },
  },
  // ensure Vite's root is the client folder
  root: CLIENT_ROOT,
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    host: true,
    port: DEV_PORT,
    // Explicitly set clientPort so the HMR client in the browser doesn't
    // end up with an undefined port (this caused the wss://...:undefined error)
    hmr: {
      protocol: HMR_PROTOCOL,
      host: HMR_PUBLIC_HOST,
      port: DEV_PORT,
      clientPort: isCodespace ? 443 : DEV_PORT,
    },
    proxy: {
      "/api": {
        // Default proxy target should match the Flask backend port (5001).
        // Can still be overridden with VITE_API_PROXY_TARGET env var.
        target: process.env.VITE_API_PROXY_TARGET || "http://localhost:5001",
        changeOrigin: true,
        secure: false,
      },
    },
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
    watch: {
      // Reduce file watching in Codespaces to prevent excessive reloads
      ignored: isCodespace ? ['**/node_modules/**', '**/.git/**'] : undefined,
    },
  },
});
