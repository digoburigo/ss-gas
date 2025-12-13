import path from "node:path";
import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import { devtools } from "@tanstack/devtools-vite";
import tanstackRouter from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import Icons from "unplugin-icons/vite";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";
import tsConfigPaths from "vite-tsconfig-paths";
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
});

const ReactCompilerConfig = {};

const env = z.parse(envSchema, process.env);
const webUrl = new URL(env.PUBLIC_WEB_URL);
const host = webUrl.hostname;
const port = parseInt(webUrl.port, 10);

export default defineConfig({
	plugins: [
		tsConfigPaths({
			projects: ["./tsconfig.json"],
		}),
		devtools(),
		tanstackRouter({
			routeToken: "layout",
			autoCodeSplitting: true,
		}),
		tailwindcss(),
		react({
			babel: {
				plugins: [["babel-plugin-react-compiler", ReactCompilerConfig]],
			},
		}),
		Icons({ compiler: "jsx", jsx: "react" }),
		VitePWA({
			registerType: "autoUpdate",
			manifest: {
				name: "clinic",
				short_name: "clinic",
				description: "clinic",
				theme_color: "#0c0c0c",
			},
			pwaAssets: { disabled: false, config: true },
			devOptions: { enabled: true },
		}),
	],
	// base: env.PUBLIC_BASE_PATH,
	envPrefix: "PUBLIC_",
	server: {
		host,
		port,
		strictPort: true,
	},
	// build: {
	//   rollupOptions: {
	//     output: {
	//       /**
	//        * Modified from:
	//        * https://github.com/vitejs/vite/discussions/9440#discussioncomment-11430454
	//        */
	//       manualChunks(id) {
	//         if (id.includes("node_modules")) {
	//           const modulePath = id.split("node_modules/")[1];
	//           const topLevelFolder = modulePath?.split("/")[0];
	//           if (topLevelFolder !== ".pnpm") {
	//             return topLevelFolder;
	//           }
	//           const scopedPackageName = modulePath?.split("/")[1];
	//           const chunkName =
	//             scopedPackageName?.split("@")[
	//               scopedPackageName.startsWith("@") ? 1 : 0
	//             ];
	//           return chunkName;
	//         }
	//       },
	//     },
	//   },
	// },
	resolve: {
		alias: {
			"~": path.resolve(__dirname, "./src"),
		},
	},
});
