import { defineConfig } from 'vite';
import topLevelAwait from 'vite-plugin-top-level-await';
import wasm from "vite-plugin-wasm";

export default defineConfig({
  server: {
    open: true
  },
  plugins: [wasm(),topLevelAwait()]
}); 