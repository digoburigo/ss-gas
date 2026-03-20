import path from "node:path";
import { fileURLToPath } from "node:url";
import babel from "@rolldown/plugin-babel";
import tailwindcss from "@tailwindcss/vite";
import { devtools } from "@tanstack/devtools-vite";
import tanstackRouter from "@tanstack/router-plugin/vite";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import Icons from "unplugin-icons/vite";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";
import { visualizer } from "rollup-plugin-visualizer";
import * as z from "zod";

/**
 * Fixes issue with "__dirname is not defined in ES module scope"
 * https://flaviocopes.com/fix-dirname-not-defined-es-module-scope
 *
 * This is only necessary when using vite with `--configLoader runner`.
 * We use this option to allow for importing TS files from monorepos.
 * https://vite.dev/config/#configuring-vite
 */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envSchema = z.object({
  /**
   * Since vite is only used during development, we can assume the structure
   * will resemble a URL such as: http://localhost:3001.
   * This will then be used to set the vite dev server's host and port.
   */
  PUBLIC_WEB_URL: z.url().optional().default("http://localhost:3001"),

  /**
   * Set this if you want to run or deploy your app at a base URL. This is
   * usually required for deploying a repository to Github/Gitlab pages.
   */
  PUBLIC_BASE_PATH: z
    .string()
    .optional()
    .default("/")
    .refine((val) => val.startsWith("/"), {
      message: 'Base path must start with "/"',
    }),

  ANALYZE: z
    .string()
    .optional()
    .transform((v) => v === "true"),
});

const env = z.parse(envSchema, process.env);
const webUrl = new URL(env.PUBLIC_WEB_URL);
const host = webUrl.hostname;
const port = Number.parseInt(webUrl.port, 10);

export default defineConfig(({ command }) => {
  const isDev = command === "serve";

  return {
    plugins: [
      ...(isDev ? [devtools()] : []),
      ...(env.ANALYZE
        ? [visualizer({ filename: "dist/stats.html", gzipSize: true })]
        : []),
      tanstackRouter({
        routeToken: "layout",
        autoCodeSplitting: true,
      }),
      tailwindcss(),
      react({
        exclude: [/zenstack\/schema\.ts$/],
      }),
      babel({
        plugins: [["@babel/plugin-syntax-typescript", { isTSX: true }]],
        presets: [reactCompilerPreset()],
      }),
      Icons({ compiler: "jsx", jsx: "react" }),
      VitePWA({
        registerType: "autoUpdate",
        workbox: {
          globPatterns: [
            "**/*.{html,css,webmanifest}",
            "**/*.{png,svg,ico,jpg,jpeg,webp,avif}",
            "**/*.{woff,woff2,ttf,eot}",
          ],

          maximumFileSizeToCacheInBytes: 1.5 * 1024 * 1024,
          runtimeCaching: [
            {
              handler: "StaleWhileRevalidate",
              options: {
                cacheName: "js-chunks",
                expiration: {
                  maxAgeSeconds: 60 * 60 * 24 * 30,
                  maxEntries: 60,
                },
              },
              urlPattern: /\/assets\/.*\.js$/,
            },
          ],
        },
        manifest: {
          name: "programagas.ai",
          short_name: "programagas.ai",
          description: "Plataforma de programação de gás com IA",
          theme_color: "#0c0c0c",
        },
        pwaAssets: { disabled: false, config: true },
        devOptions: { enabled: true },
      }),
    ],
    build: {
      sourcemap: false,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes("node_modules")) {
              return;
            }

            // PlateJS editor (~30+ packages)
            if (
              id.includes("/node_modules/platejs/") ||
              id.includes("/node_modules/@platejs/")
            ) {
              return "vendor-plate";
            }

            // Recharts + D3 dependencies (~300KB)
            if (
              id.includes("/node_modules/recharts/") ||
              id.includes("/node_modules/d3-")
            ) {
              return "vendor-recharts";
            }

            // DnD Kit
            if (id.includes("/node_modules/@dnd-kit/")) {
              return "vendor-dnd-kit";
            }

            // React PDF + pdfjs-dist
            if (
              id.includes("/node_modules/react-pdf/") ||
              id.includes("/node_modules/pdfjs-dist/")
            ) {
              return "vendor-react-pdf";
            }

            // html2canvas-pro
            if (id.includes("/node_modules/html2canvas-pro/")) {
              return "vendor-html2canvas";
            }

            // pdf-lib
            if (id.includes("/node_modules/pdf-lib/")) {
              return "vendor-pdf-lib";
            }

            // react-player
            if (id.includes("/node_modules/react-player/")) {
              return "vendor-react-player";
            }
          },
        },
      },
    },
    // base: env.PUBLIC_BASE_PATH,
    envPrefix: "PUBLIC_",
    server: {
      host,
      port,
      strictPort: true,
    },
    resolve: {
      alias: {
        "~": path.resolve(__dirname, "./src"),
      },
      tsconfigPaths: true,
    },
  };
});
