/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface ImportMetaEnv {
  readonly VITE_GOOGLE_MAPS_API_KEY?: string;
  readonly VITE_NARRATIVE_API_URL?: string;
  readonly VITE_NARRATIVE_API_KEY?: string;
  readonly VITE_PREDICTION_API_URL?: string;
  readonly VITE_PREDICTION_API_KEY?: string;
  /** Optional override for translation proxy (default `/api/translate`). */
  readonly VITE_TRANSLATE_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module "*.svg?raw" {
  const content: string;
  export default content;
}
