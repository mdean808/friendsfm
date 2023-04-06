import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { sentryVitePlugin } from '@sentry/vite-plugin';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    svelte(),
    sentryVitePlugin({
      org: 'friendsfm',
      project: 'friendsfm-app',

      // Specify the directory containing build artifacts
      include: './dist',

      // Auth tokens can be obtained from https://sentry.io/settings/account/api/auth-tokens/
      // and need `project:releases` and `org:read` scopes
      authToken: process.env.SENTRY_AUTH_TOKEN,

      // Optionally uncomment the line below to override automatic release name detection
      release: 'friendsfm@0.0.6',
      telemetry: false,
    }),
  ],
  server: {
    port: 8080,
    host: '0.0.0.0',
  },
});
