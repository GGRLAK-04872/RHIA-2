import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

const base = process.env.VITE_BASE_PATH ?? "/";

export default defineConfig({
  base,
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: "script-defer",
      includeAssets: ["rhia-icon.svg"],
      manifest: {
        name: "RHIA 2.0",
        short_name: "RHIA",
        description: "Lokale, kontrollierbare Assistenzbasis von RH Produktion",
        theme_color: "#16070f",
        background_color: "#09060a",
        display: "standalone",
        orientation: "any",
        scope: base,
        start_url: base,
        icons: [
          {
            src: "rhia-icon.svg",
            sizes: "any",
            type: "image/svg+xml",
            purpose: "any maskable",
          },
        ],
      },
      workbox: {
        clientsClaim: true,
        cleanupOutdatedCaches: true,
        navigateFallback: "index.html",
        globPatterns: ["**/*.{js,css,html,json,svg,webmanifest}"],
        runtimeCaching: [],
        skipWaiting: true,
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
  build: {
    sourcemap: false,
    target: "es2022",
  },
  server: {
    host: "0.0.0.0",
    strictPort: true,
  },
  preview: {
    host: "0.0.0.0",
    strictPort: true,
  },
});
