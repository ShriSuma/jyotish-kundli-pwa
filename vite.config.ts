import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
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
});
