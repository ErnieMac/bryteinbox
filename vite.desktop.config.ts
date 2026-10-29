import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// Desktop uses a bundled SPA served over loopback, not file:// or a hosted site.
export default defineConfig({
  nitro: false,
  envDefine: false,
  tanstackStart: {
    spa: { enabled: true, prerender: { outputPath: "/index" } },
  },
});