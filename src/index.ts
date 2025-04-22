import { Asset } from "@three.ez/main";
import { ProgressManager } from "./ui/ProgressManager";
import { Main } from "./main";

// Init progress bar UI
const progressBar = new ProgressManager();

// Preload all pending assets with progress tracking
await Asset.preloadAllPending({
  onProgress: (event) => progressBar.updateProgress(event),
  onError: (error) => console.error("Asset preload error:", error),
});

// Load Rapier physics engine asynchronously
import("@dimforge/rapier3d").then((rapier3d) => {
  // Expose Rapier globally
  globalThis.RAPIER = rapier3d;

  // Initialize the main app
  new Main();

  // Hide the loading UI
  progressBar.hideProgressBar();

  // Mount level selector UI
  // const levelSelect = new LevelSelect();
  // levelSelect.mount();
});

