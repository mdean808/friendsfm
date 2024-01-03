import { defineConfig, loadEnv } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { sentryVitePlugin } from '@sentry/vite-plugin';

// https://vitejs.dev/config/
export default ({ mode }) => {
  process.env = { ...process.env, ...loadEnv(mode, process.cwd()) };
  return defineConfig({
    build: {
      sourcemap: true, // Source map generation must be turned on
    },
    plugins: [
      svelte(),
      process.env.RELEASE === 'true'
        ? sentryVitePlugin({
            authToken: process.env.VITE_SENTRY_AUTH_TOKEN,
            org: 'friendsfm',
            project: 'friendsfm-app',
            release: {
              name: process.env.npm_package_version,
              cleanArtifacts: true,
            },
          })
        : {},
    ],
    server: {
      port: 8080,
      host: '0.0.0.0',
    },
  });
};
