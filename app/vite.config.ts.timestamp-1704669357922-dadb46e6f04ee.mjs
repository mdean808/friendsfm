// vite.config.ts
import { defineConfig, loadEnv } from "file:///Users/mdean/Documents/Projects/friends-fm/app/node_modules/vite/dist/node/index.js";
import { svelte } from "file:///Users/mdean/Documents/Projects/friends-fm/app/node_modules/@sveltejs/vite-plugin-svelte/src/index.js";
import { sentryVitePlugin } from "file:///Users/mdean/Documents/Projects/friends-fm/app/node_modules/@sentry/vite-plugin/dist/esm/index.mjs";
var vite_config_default = ({ mode }) => {
  process.env = { ...process.env, ...loadEnv(mode, process.cwd()) };
  return defineConfig({
    build: {
      sourcemap: true
      // Source map generation must be turned on
    },
    plugins: [
      svelte(),
      process.env.RELEASE === "true" ? sentryVitePlugin({
        authToken: process.env.VITE_SENTRY_AUTH_TOKEN,
        org: "friendsfm",
        project: "friendsfm-app",
        release: {
          name: process.env.npm_package_version,
          cleanArtifacts: true
        }
      }) : {}
    ],
    server: {
      port: 8080,
      host: "0.0.0.0"
    }
  });
};
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvVXNlcnMvbWRlYW4vRG9jdW1lbnRzL1Byb2plY3RzL2ZyaWVuZHMtZm0vYXBwXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvVXNlcnMvbWRlYW4vRG9jdW1lbnRzL1Byb2plY3RzL2ZyaWVuZHMtZm0vYXBwL3ZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9Vc2Vycy9tZGVhbi9Eb2N1bWVudHMvUHJvamVjdHMvZnJpZW5kcy1mbS9hcHAvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcsIGxvYWRFbnYgfSBmcm9tICd2aXRlJztcbmltcG9ydCB7IHN2ZWx0ZSB9IGZyb20gJ0BzdmVsdGVqcy92aXRlLXBsdWdpbi1zdmVsdGUnO1xuaW1wb3J0IHsgc2VudHJ5Vml0ZVBsdWdpbiB9IGZyb20gJ0BzZW50cnkvdml0ZS1wbHVnaW4nO1xuXG4vLyBodHRwczovL3ZpdGVqcy5kZXYvY29uZmlnL1xuZXhwb3J0IGRlZmF1bHQgKHsgbW9kZSB9KSA9PiB7XG4gIHByb2Nlc3MuZW52ID0geyAuLi5wcm9jZXNzLmVudiwgLi4ubG9hZEVudihtb2RlLCBwcm9jZXNzLmN3ZCgpKSB9O1xuICByZXR1cm4gZGVmaW5lQ29uZmlnKHtcbiAgICBidWlsZDoge1xuICAgICAgc291cmNlbWFwOiB0cnVlLCAvLyBTb3VyY2UgbWFwIGdlbmVyYXRpb24gbXVzdCBiZSB0dXJuZWQgb25cbiAgICB9LFxuICAgIHBsdWdpbnM6IFtcbiAgICAgIHN2ZWx0ZSgpLFxuICAgICAgcHJvY2Vzcy5lbnYuUkVMRUFTRSA9PT0gJ3RydWUnXG4gICAgICAgID8gc2VudHJ5Vml0ZVBsdWdpbih7XG4gICAgICAgICAgICBhdXRoVG9rZW46IHByb2Nlc3MuZW52LlZJVEVfU0VOVFJZX0FVVEhfVE9LRU4sXG4gICAgICAgICAgICBvcmc6ICdmcmllbmRzZm0nLFxuICAgICAgICAgICAgcHJvamVjdDogJ2ZyaWVuZHNmbS1hcHAnLFxuICAgICAgICAgICAgcmVsZWFzZToge1xuICAgICAgICAgICAgICBuYW1lOiBwcm9jZXNzLmVudi5ucG1fcGFja2FnZV92ZXJzaW9uLFxuICAgICAgICAgICAgICBjbGVhbkFydGlmYWN0czogdHJ1ZSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgfSlcbiAgICAgICAgOiB7fSxcbiAgICBdLFxuICAgIHNlcnZlcjoge1xuICAgICAgcG9ydDogODA4MCxcbiAgICAgIGhvc3Q6ICcwLjAuMC4wJyxcbiAgICB9LFxuICB9KTtcbn07XG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQTRULFNBQVMsY0FBYyxlQUFlO0FBQ2xXLFNBQVMsY0FBYztBQUN2QixTQUFTLHdCQUF3QjtBQUdqQyxJQUFPLHNCQUFRLENBQUMsRUFBRSxLQUFLLE1BQU07QUFDM0IsVUFBUSxNQUFNLEVBQUUsR0FBRyxRQUFRLEtBQUssR0FBRyxRQUFRLE1BQU0sUUFBUSxJQUFJLENBQUMsRUFBRTtBQUNoRSxTQUFPLGFBQWE7QUFBQSxJQUNsQixPQUFPO0FBQUEsTUFDTCxXQUFXO0FBQUE7QUFBQSxJQUNiO0FBQUEsSUFDQSxTQUFTO0FBQUEsTUFDUCxPQUFPO0FBQUEsTUFDUCxRQUFRLElBQUksWUFBWSxTQUNwQixpQkFBaUI7QUFBQSxRQUNmLFdBQVcsUUFBUSxJQUFJO0FBQUEsUUFDdkIsS0FBSztBQUFBLFFBQ0wsU0FBUztBQUFBLFFBQ1QsU0FBUztBQUFBLFVBQ1AsTUFBTSxRQUFRLElBQUk7QUFBQSxVQUNsQixnQkFBZ0I7QUFBQSxRQUNsQjtBQUFBLE1BQ0YsQ0FBQyxJQUNELENBQUM7QUFBQSxJQUNQO0FBQUEsSUFDQSxRQUFRO0FBQUEsTUFDTixNQUFNO0FBQUEsTUFDTixNQUFNO0FBQUEsSUFDUjtBQUFBLEVBQ0YsQ0FBQztBQUNIOyIsCiAgIm5hbWVzIjogW10KfQo=
