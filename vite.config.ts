import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// Simple development-only plugin for component identification
const devComponentTracker = () => ({
  name: 'dev-component-tracker',
  transform(code: string, id: string) {
    if (process.env.NODE_ENV !== 'development' || !id.endsWith('.tsx')) return;
    return code;
  }
});

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react(), mode === "development" && devComponentTracker()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
