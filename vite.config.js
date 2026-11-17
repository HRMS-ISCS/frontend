import { fileURLToPath, URL } from 'node:url';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import basicSsl from '@vitejs/plugin-basic-ssl';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  // Zoho Sign refuses to mint an embedded signing URL for an `http` host
  // ("Url has invalid scheme"), so testing the signing window locally needs the
  // dev server on https. Set VITE_DEV_HTTPS=true in .env to turn it on; the
  // certificate is self-signed, so the browser asks you to accept it once.
  //
  // Dev only - `server` and `plugins` here have no effect on `vite build`.
  const devHttps = env.VITE_DEV_HTTPS === 'true';

  return {
    // The backend emails password links to {FRONTEND_URL}/hrms/reset-password,
    // so the app is served under /hrms/ by default.
    base: env.VITE_BASE_PATH || '/hrms/',
    plugins: [react(), ...(devHttps ? [basicSsl()] : [])],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
      port: 5173,
      https: devHttps,
      proxy: {
        // Set VITE_API_BASE_URL=/api and every backend call goes out on the
        // page's own origin, then through here to the API. That keeps one
        // origin in the browser: no mixed content when the dev server is on
        // https, and no CORS preflight either.
        //
        // Unused when VITE_API_BASE_URL is an absolute URL, so this is safe to
        // leave in place.
        '/api': {
          target: env.VITE_PROXY_TARGET || 'http://localhost:8000',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ''),
        },
      },
    },
  };
});
