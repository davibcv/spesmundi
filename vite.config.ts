import { defineConfig, Plugin } from "vite";
import react from "@vitejs/plugin-react";
import fs from "fs";
import path from "path";
import { handleAnalyzeActivity } from "./src/server/aiBackend";

function readServerKey(): string {
  try {
    const envFile = path.resolve(process.cwd(), ".env");
    if (fs.existsSync(envFile)) {
      const raw = fs.readFileSync(envFile, "utf8");
      const m = raw.match(/^(?:GEMINI_API_KEY|VITE_GEMINI_API_KEY)=(AIza[^\r\n\s]+)/m);
      if (m) return m[1].trim();
    }
  } catch {}
  return process.env.GEMINI_API_KEY || "";
}

function aiBackendPlugin(): Plugin {
  return {
    name: "ai-backend-plugin",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url || "";
        if (url.startsWith("/api/analyze-activity") && req.method === "POST") {
          const apiKey = readServerKey();
          handleAnalyzeActivity(req, res, apiKey);
          return;
        }
        if (url.startsWith("/api/ai-health") && req.method === "GET") {
          const apiKey = readServerKey();
          res.setHeader("Content-Type", "application/json");
          res.statusCode = 200;
          res.end(JSON.stringify({
            status: "ok",
            hasKey: Boolean(apiKey && apiKey.startsWith("AIza")),
            model: "gemini-flash-lite-latest"
          }));
          return;
        }
        next();
      });
    }
  };
}

export default defineConfig({
  plugins: [react(), aiBackendPlugin()],
  server: {
    host: "0.0.0.0",
    port: 5173,
    strictPort: true,
  },
  preview: {
    host: "0.0.0.0",
    port: 5173,
    strictPort: true,
  },
});
