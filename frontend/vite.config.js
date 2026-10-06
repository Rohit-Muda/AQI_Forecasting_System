import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [react()],
    define: {
      "import.meta.env.API_URL": JSON.stringify(env.API_URL || env.VITE_API_URL || ""),
    },
    server: {
      port: 5173,
      host: true,
    },
  };
});
