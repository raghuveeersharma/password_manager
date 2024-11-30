import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  base: "/password_manager",
  plugins: [react()],
  server: {
    host: "0.0.0.0", // Expose on all network interfaces
    port: 5173, // Choose a port (default is 5173)
  },
});
