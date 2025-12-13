import { defineConfig } from "tsdown";

export default defineConfig({
	entry: "./src/index.ts",
	format: "esm",
	outDir: "./dist",
	clean: true,
	platform: "node",
	// Bundle all dependencies except Node.js built-ins
	noExternal: (id) => {
		// Bundle workspace packages
		if (id.startsWith("@acme/")) return true;
		// Bundle all other dependencies (except Node.js built-ins and absolute paths)
		if (!id.startsWith("node:") && !id.startsWith("/")) return true;
		return false;
	},
});
