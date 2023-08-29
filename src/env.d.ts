/// <reference types="vite/client" />
interface ImportMetaEnv {
  readonly VITE_GOOGLE_REVERSE_GEOCODING_KEY: string;
  readonly VITE_SPOTIFY_CLIENT_ID: string;
  readonly VITE_SPOTIFY_REDIRECT_URL: string;
  readonly VITE_APPLE_MUSIC_JWT_TOKEN: string;
  readonly SENTRY_AUTH_TOKEN: string;
  readonly VITE_SENTRY_DSN: string;
  readonly PORT: string;
  readonly APPLE_MUSIC_DEVELOPER_TOKEN: string;
  readonly VITE_GOOGLE_MAPS_IOS: string;
  readonly VITE_GOOGLE_MAPS_ANDROID: string;
  readonly VITE_GOOGLE_MAPS_BROWSER: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
