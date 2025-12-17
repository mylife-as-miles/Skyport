
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react()],
    server: {
      host: true,
      proxy: {
        '/api/yelp': {
          target: 'https://api.yelp.com/v3',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/yelp/, ''),
          headers: {
            Authorization: `Bearer ${env.YELP_API_KEY}`
          }
        }
      }
    },
    build: {
      outDir: 'dist',
      sourcemap: true
    },
    define: {
      'process.env': env
    }
  };
});
