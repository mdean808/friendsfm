import { sentrySvelteKit } from '@sentry/sveltekit';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import child_process from 'child_process';

const file = fileURLToPath(new URL('package.json', import.meta.url));
const json = readFileSync(file, 'utf8');
const pkg = JSON.parse(json);
const commit = child_process.execSync('git rev-parse --short HEAD').toString();

export default defineConfig({
  plugins: [
    sentrySvelteKit({
      sourceMapsUploadOptions: {
        telemetry: false,
        org: 'friendsfm',
        project: 'friendsfm-app',
        authToken: process.env.SENTRY_AUTH_TOKEN,
        release: commit,
      },
      autoUploadSourceMaps: !!process.env.RELEASE,
    }),
    sveltekit(),
  ],
  define: {
    VERSION: JSON.stringify(pkg.version),
    RELEASE: JSON.stringify(process.env.RELEASE),
    COMMIT: JSON.stringify(commit),
  },
  server: {
    port: 8080,
    host: '0.0.0.0',
  },
  preview: {
    port: 8080,
  },
});
