import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  base: process.env.GITHUB_PAGES === "1" ? "/lumos-fireworks/" : "/",
  plugins: [react()],
  build: {
    // maplibre 단일 청크가 1 MB 를 넘는다. 더 쪼갤 수 없는 라이브러리라 경고 기준만 올린다.
    chunkSizeWarningLimit: 1100,
    // three 와 maplibre 는 각각 수백 KB 다. 라우트 청크와 분리해 캐시가 오래 살게 한다.
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("/node_modules/three/")) return "three";
          if (id.includes("/node_modules/maplibre-gl/")) return "maplibre";
          if (/\/node_modules\/(react|react-dom|react-router|react-router-dom|scheduler)\//.test(id)) {
            return "react";
          }
          return undefined;
        },
      },
    },
  },
  test: {
    globals: true,
    include: ["tests/**/*.test.{ts,tsx}"],
  },
});
