import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
	// GitHub Pages serves project sites under /<repo>/. The workflow sets
	// BASE_PATH at build time so assets and routes resolve correctly.
	base: process.env.BASE_PATH || "/",
	plugins: [react(), tailwindcss()],
});
