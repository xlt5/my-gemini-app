import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    // Inject process.env for the Gemini API key usage in the service
    'process.env': process.env
  },
  server: {
    host: true, // Listen on all local IPs
    port: 5173
  }
});