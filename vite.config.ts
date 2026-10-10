// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { VitePWA } from "vite-plugin-pwa";
import { readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import type { Plugin } from "vite";

const pwa = VitePWA({
  strategies: "generateSW",
  filename: "sw.js",
  outDir: "dist/client",
  manifest: false,
  injectRegister: null,
  registerType: "autoUpdate",
  devOptions: { enabled: false },
  workbox: {
    globDirectory: "dist/client",
    globPatterns: ["assets/**/*.{js,css,woff2}", "app-icon-512.png", "manifest.webmanifest"],
    navigateFallback: null,
    cleanupOutdatedCaches: true,
    maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
    additionalManifestEntries: [],
    runtimeCaching: [{
      urlPattern: ({ request, url }) => request.mode === "navigate" &&
        url.origin === self.location.origin && ["/", "/inicio", "/agenda", "/clientes", "/servicos"].includes(url.pathname),
      handler: "NetworkFirst",
      options: { cacheName: "nuvie-pages-v1", networkTimeoutSeconds: 3,
        precacheFallback: { fallbackURL: "/offline-shell.html" },
        expiration: { maxEntries: 5, maxAgeSeconds: 86400 }, cacheableResponse: { statuses: [200] } },
    }],
  },
});
// TanStack/Nitro finish rendering HTML after the client bundle closes.
// Defer only SW generation to buildApp; keep all other PWA plugin hooks.
for (const plugin of pwa) {
  if (plugin.name === "vite-plugin-pwa:build") delete plugin.closeBundle;
}
const finishOfflineBuild: Plugin = {
  name: "nuvie-offline-after-prerender",
  apply: "build",
  buildApp: { order: "post", async handler() {
    const shell = await readFile("dist/client/index.html", "utf8");
    await writeFile("dist/client/offline-shell.html", shell);
    const plugin = pwa.find((item) => item.api?.generateSW);
    if (!plugin) throw new Error("Missing offline build generator");
    plugin.api.extendManifestEntries(() => [{ url: "/offline-shell.html", revision: createHash("sha256").update(shell).digest("hex") }]);
    await plugin.api.generateSW();
  } },
};

export default defineConfig({
  vite: { plugins: [...pwa, finishOfflineBuild] },
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
    prerender: { enabled: true, autoStaticPathsDiscovery: false },
    pages: [{ path: "/", prerender: { enabled: true, crawlLinks: false } }],
  },
});
