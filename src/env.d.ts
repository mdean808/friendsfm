/// <reference types="vite/client" />
interface ImportMetaEnv {
  readonly VITE_GOOGLE_REVERSE_GEOCODING_KEY: string;
  readonly VITE_GOOGLE_MAPS_KEY: string;
  readonly VITE_SPOTIFY_CLIENT_ID: string;
  readonly VITE_SPOTIFY_REDIRECT_URL: string;
  readonly VITE_APPLE_MUSIC_JWT_TOKEN: string;
  readonly SENTRY_AUTH_TOKEN: string;
  readonly VITE_SENTRY_DSN: string;
  readonly PORT: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
