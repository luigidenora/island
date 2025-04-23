import { BasicCharacterInputHandler } from "./CharacterInput";

/**
 * Handles all input for the character controller.
 * Manages keyboard and mouse input.
 */
export class CharacterKeybordInputHandler extends BasicCharacterInputHandler {

  constructor() {
    super();

    document.addEventListener("keydown", (e) => this._onKeyDown(e), false);
    document.addEventListener("keyup", (e) => this._onKeyUp(e), false);
    document.addEventListener("mousedown", (e) => this._onMouseDown(e), false);
    document.addEventListener("mouseup", (e) => this._onMouseUp(e), false);
  }

  private _onMouseDown(e: MouseEvent): void {
    if (e.button === 0) {
      this.keys.sword = true;
    }
  }

  private _onMouseUp(e: MouseEvent): void {
    if (e.button === 0) {
      this.keys.sword = false;
    }
  }

  private _onKeyDown(e: KeyboardEvent): void {
    console.log("Key pressed:", e.code);
    switch (e.code) {
      case "KeyW":
        this.keys.forward = true;
        break;
      case "KeyS":
        this.keys.backward = true;
        break;
      case "KeyA":
        this.keys.left = true;
        break;
      case "KeyD":
        this.keys.right = true;
        break;
      case "ShiftLeft":
      case "ShiftRight":
        this.keys.run = true;
        break;
      case "Space":
        this.keys.jump = true;
        break;
    }
  }

  private _onKeyUp(e: KeyboardEvent): void {
    switch (e.code) {
      case "KeyW":
        this.keys.forward = false;
        break;
      case "KeyS":
        this.keys.backward = false;
        break;
      case "KeyA":
        this.keys.left = false;
        break;
      case "KeyD":
        this.keys.right = false;
        break;
      case "ShiftLeft":
      case "ShiftRight":
        this.keys.run = false;
        break;
      case "Space":
        this.keys.jump = false;
        break;
    }
  }
}
