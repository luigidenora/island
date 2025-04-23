import { VirtualJoystick } from "../components/virtual-joystick/VirtualJoystick";
import { BasicCharacterInputHandler } from "./CharacterInput";

/**
 * Type definition for character input
 */
export interface CharacterInput {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
  jump: boolean;
  run: boolean;
  sword: boolean;
}

/**
 * Handles all input for the character controller.
 * Manages touch input.
 */
export class CharacterInputTouchHandler extends BasicCharacterInputHandler {

  constructor(private touchJoystick: VirtualJoystick) {
    super();

    // Add event listeners for joystick events
    this.touchJoystick.addEventListener("joystickmove", (e: any) => this._onJoystickMove(e), false);
    this.touchJoystick.addEventListener("joystickstop", () => this._onJoystickStop(), false);

    // Add event listeners for sword and jump actions
    this.touchJoystick.addEventListener("sword", () => this._onSwordAction(), false);
    this.touchJoystick.addEventListener("jump", () => this._onJumpAction(), false);
  }

  private _onJoystickMove(e: CustomEvent): void {
    const { x, y } = e.detail;

    this.keys.forward = y < -0.5;
    this.keys.backward = y > 0.5;
    this.keys.left = x < -0.5;
    this.keys.right = x > 0.5;

    // Check if running forward for more than 5 seconds
    if (this.keys.forward) {
      setTimeout(() => {
        if (this.keys.forward) {
          this.keys.run = true;
        }
      }, 5000);
    }
  }

  private _onJoystickStop(): void {
    this.keys.forward = false;
    this.keys.backward = false;
    this.keys.left = false;
    this.keys.right = false;
    this.keys.run = false;
  }

  private _onSwordAction(): void {
    this.keys.sword = true;
    setTimeout(() => {
      this.keys.sword = false;
    }, 100); // Reset sword action after 100ms
  }

  private _onJumpAction(): void {
    this.keys.jump = true;
    setTimeout(() => {
      this.keys.jump = false;
    }, 100); // Reset sword action after 100ms
  }
}
