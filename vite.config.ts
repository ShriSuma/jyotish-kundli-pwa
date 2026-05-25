import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
  server: {
    proxy: {
      "/api/sunrise-sunset": {
        target: "https://api.sunrise-sunset.org",
        changeOrigin: true,
        rewrite: (path) => {
          const q = path.includes("?") ? path.slice(path.indexOf("?")) : "";
          return `/json${q}`;
        }
      }
    }
  },
  build: {
    sourcemap: "hidden",
    rollupOptions: {
      output: {
        entryFileNames: "assets/[name].[hash].js",
        chunkFileNames: "assets/[name].[hash].js",
        assetFileNames: "assets/[name].[hash].[ext]"
      }
    }
  },
  plugins: [
    react(),
    {
      name: "dev-translate-api",
      configureServer(server) {
        server.middlewares.use("/api/translate", async (req, res) => {
          if (req.method === "OPTIONS") {
            res.statusCode = 204;
            res.end();
            return;
          }
          if (req.method !== "POST") {
            res.statusCode = 405;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ error: "Method not allowed" }));
            return;
          }
          try {
            const chunks: Buffer[] = [];
            for await (const chunk of req) {
              chunks.push(chunk as Buffer);
            }
            const body = JSON.parse(Buffer.concat(chunks).toString("utf8")) as {
              texts?: string[];
              target?: string;
              source?: string;
            };
            const texts = Array.isArray(body.texts) ? body.texts.map(String) : [];
            const target = String(body.target ?? "en").split("-")[0];
            const source = String(body.source ?? "en").split("-")[0];
            if (!texts.length) {
              res.statusCode = 400;
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify({ error: "texts array required" }));
              return;
            }
            if (env.GOOGLE_TRANSLATE_API_KEY) {
              process.env.GOOGLE_TRANSLATE_API_KEY = env.GOOGLE_TRANSLATE_API_KEY;
            }
            // @ts-expect-error shared server helper has .mjs types beside lib/translateCore.mjs
            const { translateTextsServer } = await import("./lib/translateCore.mjs");
            const translations = await translateTextsServer(texts, target, source);
            res.statusCode = 200;
            res.setHeader("Content-Type", "application/json");
            res.end(
              JSON.stringify({
                translations,
                provider: env.GOOGLE_TRANSLATE_API_KEY ? "google" : "gtx"
              })
            );
          } catch (e) {
            res.statusCode = 502;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }));
          }
        });
        server.middlewares.use("/api/kundli-narrative", async (req, res) => {
          if (req.method === "OPTIONS") {
            res.statusCode = 204;
            res.end();
            return;
          }
          if (req.method !== "POST") {
            res.statusCode = 405;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ error: "Method not allowed" }));
            return;
          }
          try {
            const chunks: Buffer[] = [];
            for await (const chunk of req) {
              chunks.push(chunk as Buffer);
            }
            const body = JSON.parse(Buffer.concat(chunks).toString("utf8")) as {
              factSheet?: { houses?: unknown[] };
              lang?: string;
            };
            if (env.GEMINI_API_KEY) process.env.GEMINI_API_KEY = env.GEMINI_API_KEY;
            if (env.OPENAI_API_KEY) process.env.OPENAI_API_KEY = env.OPENAI_API_KEY;
            // @ts-expect-error server helper
            const { generateHouseNarrativesServer } = await import("./lib/kundliNarrativeCore.mjs");
            const lang = String(body.lang ?? "en").split("-")[0];
            const houses = await generateHouseNarrativesServer(body.factSheet, lang, {
              ...process.env,
              GEMINI_API_KEY: env.GEMINI_API_KEY ?? process.env.GEMINI_API_KEY,
              OPENAI_API_KEY: env.OPENAI_API_KEY ?? process.env.OPENAI_API_KEY,
              GEMINI_MODEL: env.GEMINI_MODEL,
              OPENAI_MODEL: env.OPENAI_MODEL
            });
            res.statusCode = 200;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ houses }));
          } catch (e) {
            res.statusCode = 502;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }));
          }
        });
      }
    },
    VitePWA({
      strategies: "injectManifest",
      srcDir: "src",
      filename: "sw.ts",
      manifestFilename: "manifest.json",
      injectRegister: "auto",
      registerType: "autoUpdate",
      injectManifest: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,json,woff2}"]
      },
      manifest: {
        name: "Jyotish Kundli",
        short_name: "Jyotish",
        display: "standalone",
        theme_color: "#FF9933",
        background_color: "#FFF8F0",
        icons: [
          {
            src: "/icons/192.png",
            sizes: "192x192",
            type: "image/png"
          },
          {
            src: "/icons/512.png",
            sizes: "512x512",
            type: "image/png"
          }
        ]
      }
    })
  ]
  };
});
