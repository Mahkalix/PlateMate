import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
export default defineConfig({
  appType: "mpa",
  plugins: [react()],
  server: {
    host: "0.0.0.0",
    port: 8080,
    proxy: {
      "/api": {
        target: "http://127.0.0.1:3001",
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
      "/auth": { target: "http://127.0.0.1:3001" },
    },
  },
});
