import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  base: process.env.GITHUB_PAGES === "1" ? "/lumos-fireworks/" : "/",
  plugins: [react()],
  test: {
    globals: true,
    include: ["tests/**/*.test.ts"],
  },
});
