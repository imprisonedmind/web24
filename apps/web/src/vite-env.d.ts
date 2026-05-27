interface ImportMetaEnv {
  readonly VITE_ENABLE_DEVTOOLS?: string;
  readonly VITE_SITE_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
