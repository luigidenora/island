import { defineConfig } from 'vite';
import topLevelAwait from 'vite-plugin-top-level-await';
export default defineConfig({
  server: {
    open: true
  },
  plugins: [topLevelAwait()]
}); 