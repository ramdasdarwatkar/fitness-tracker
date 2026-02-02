import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  // 1. MUST MATCH YOUR REPO NAME
  base: "/fitness-tracker/",

  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico", "apple-touch-icon.png", "mask-icon.svg"],
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg}"],
        maximumFileSizeToCacheInBytes: 4000000,
      },
      manifest: {
        name: "Fitness Tracker Pro",
        short_name: "FitTrack",
        description: "Track your workouts and body metrics",
        theme_color: "#0f172a",
        background_color: "#0f172a",
        display: "standalone",
        orientation: "portrait",

        // 2. CRITICAL PWA UPDATES FOR GITHUB PAGES
        scope: "/fitness-tracker/",
        start_url: "/fitness-tracker/",

        icons: [
          {
            src: "pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
      },
    }),
  ],

  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (id.includes("lucide-react")) {
              return "vendor-icons";
            }
            if (id.includes("@supabase") || id.includes("date-fns")) {
              return "vendor-logic";
            }
            if (
              id.includes("react") ||
              id.includes("react-dom") ||
              id.includes("react-router-dom")
            ) {
              return "vendor-react";
            }
            return "vendor-utils";
          }
        },
      },
    },
  },
});
