import { Asset } from "@three.ez/main";
import { ProgressManager } from "./ui/ProgressManager";
import { Main } from "./main";
import { LevelSelect } from "./ui/overlays/LevelSelect";
import { ThirdPersonCamera } from "./controllers/ThirdPersonCamera";

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
  const main = new Main();
  const thirdPersonCamera = main.getThirdPersonCamera();

  // Hide the loading UI
  progressBar.hideProgressBar();

  // Mount level selector UI
  const levelSelect = new LevelSelect(thirdPersonCamera);
  levelSelect.mount();

  let gameOver = false
  // on game over event
  window.addEventListener("game-over", () => {
    if(gameOver) return
    // show modal with game over message only once
    gameOver = true
    // show modal with win message 
    const modal = document.createElement("div");
    modal.className = "win-modal";

    const title = document.createElement("h1");
    title.textContent = "Game Over!";
    title.className = "win-modal__title";

    const message = document.createElement("p");
    message.textContent = "reload the page to play again";
    message.className = "win-modal__message";

    const closeButton = document.createElement("button");
    closeButton.textContent = "Close";
    closeButton.className = "win-modal__button";
    closeButton.addEventListener("click", () => {
      window.location.reload();
    });

    modal.appendChild(title);
    modal.appendChild(message);
    modal.appendChild(closeButton);
    document.body.appendChild(modal);
  });
let chestCollision = false
  // on chestCollision game end 
  window.addEventListener("chestCollision", () => {
    if(chestCollision) return
    chestCollision = true
    gameOver = true
    // show modal with win message 
    const modal = document.createElement("div");
    modal.className = "win-modal";

    const title = document.createElement("h1");
    title.textContent = "You Win!";
    title.className = "win-modal__title";

    const message = document.createElement("p");
    message.textContent = "Congratulations!";
    message.className = "win-modal__message";

    const closeButton = document.createElement("button");
    closeButton.textContent = "Close";
    closeButton.className = "win-modal__button";
    closeButton.addEventListener("click", () => {
      window.location.reload();
    });

    modal.appendChild(title);
    modal.appendChild(message);
    modal.appendChild(closeButton);
    document.body.appendChild(modal);

    window.removeEventListener("chestCollision", () => {});
    window.removeEventListener("game-over", () => {});
  });
});

