import { TouchJoystick } from "../components/TouchJoystick";

/**
 * Type definition for character input
 */
export interface CharacterInput {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
  space: boolean;
  shift: boolean;
  mousePressed: boolean;
  moveX: number; // -1 to 1 (left to right)
  moveY: number; // -1 to 1 (backward to forward)
}

/**
 * Directional input values from any source (keyboard or joystick)
 */
interface DirectionalInput {
  x: number; // -1 to 1 (left to right)
  y: number; // -1 to 1 (backward to forward)
}

/**
 * Handles all input for the character controller.
 * Manages keyboard, mouse, and touch input including joystick.
 */
export class CharacterInputHandler {
  public keys: CharacterInput = {
    forward: false,
    backward: false,
    left: false,
    right: false,
    space: false,
    shift: false,
    mousePressed: false,
    moveX: 0,
    moveY: 0
  };

  private touchStartX: number = 0;
  private touchStartY: number = 0;
  private touchStartTime: number = 0;
  private readonly TAP_DURATION = 200; // Maximum duration for a tap in milliseconds
  private readonly TAP_DISTANCE = 10; // Maximum distance for a tap in pixels
  private joystick: TouchJoystick;
  private keyboardInput: DirectionalInput = { x: 0, y: 0 };
  private joystickInput: DirectionalInput = { x: 0, y: 0 };
  private readonly INPUT_THRESHOLD = 0.3; // Threshold for considering input significant
  private isJoystickActive: boolean = false;

  constructor() {
    // Initialize keyboard and mouse event listeners
    document.addEventListener("keydown", (e) => this._onKeyDown(e), false);
    document.addEventListener("keyup", (e) => this._onKeyUp(e), false);
    document.addEventListener("mousedown", (e) => this._onMouseDown(e), false);
    document.addEventListener("mouseup", (e) => this._onMouseUp(e), false);
    
    // Initialize joystick
    this.joystick = new TouchJoystick();
    
    // Add touch event listeners for non-joystick areas
    document.addEventListener("touchstart", (e) => this._onTouchStart(e), false);
    document.addEventListener("touchmove", (e) => this._onTouchMove(e), false);
    document.addEventListener("touchend", (e) => this._onTouchEnd(e), false);
  }

  /**
   * Updates the input state.
   * This method should be called once per frame.
   */
  update(): void {
    // Get joystick values
    const joystickValues = this.joystick.getJoystickValues();
    this.joystickInput = {
      x: joystickValues.x,
      y: joystickValues.y
    };
    
    // Check if joystick is being actively used
    this.isJoystickActive = Math.abs(joystickValues.x) > this.INPUT_THRESHOLD || 
                            Math.abs(joystickValues.y) > this.INPUT_THRESHOLD;
    
    // Combine inputs from both sources
    const combinedInput = this._combineInputs();
    
    // Apply the combined input to the character input state
    this._applyDirectionalInput(combinedInput);
  }

  /**
   * Combines inputs from keyboard and joystick
   */
  private _combineInputs(): DirectionalInput {
    // If joystick is active, use it exclusively
    if (this.isJoystickActive) {
      return this.joystickInput;
    }
    
    // If keyboard is being used, use keyboard input
    if (Math.abs(this.keyboardInput.x) > 0 || Math.abs(this.keyboardInput.y) > 0) {
      return this.keyboardInput;
    }
    
    // Default to no input
    return { x: 0, y: 0 };
  }

  /**
   * Applies directional input to the character input state
   */
  private _applyDirectionalInput(input: DirectionalInput): void {
    // Store continuous input values for smooth movement
    this.keys.moveX = input.x;
    this.keys.moveY = input.y;
    
    // Also set binary flags for backward compatibility
    this.keys.forward = input.y < -this.INPUT_THRESHOLD;
    this.keys.backward = input.y > this.INPUT_THRESHOLD;
    this.keys.left = input.x < -this.INPUT_THRESHOLD;
    this.keys.right = input.x > this.INPUT_THRESHOLD;
  }

  /**
   * Handles touch start events for non-joystick areas
   */
  private _onTouchStart(e: TouchEvent): void {
    // Skip if this is a joystick touch
    if (this._isJoystickTouch(e)) return;
    
    e.preventDefault();
    if (e.touches.length === 1) {
      this.touchStartX = e.touches[0].clientX;
      this.touchStartY = e.touches[0].clientY;
      this.touchStartTime = Date.now();
    }
  }

  /**
   * Handles touch move events for non-joystick areas
   */
  private _onTouchMove(e: TouchEvent): void {
    // Skip if this is a joystick touch
    if (this._isJoystickTouch(e)) return;
    
    e.preventDefault();
    // Movement is handled by the joystick
  }

  /**
   * Handles touch end events for non-joystick areas
   */
  private _onTouchEnd(e: TouchEvent): void {
    // Skip if this is a joystick touch
    if (this._isJoystickTouch(e)) return;
    
    e.preventDefault();
    if (e.changedTouches.length === 1) {
      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;
      
      const deltaX = touchEndX - this.touchStartX;
      const deltaY = touchEndY - this.touchStartY;
      const touchDuration = Date.now() - this.touchStartTime;

    }
  }

  /**
   * Checks if a touch event is within the joystick area
   */
  private _isJoystickTouch(e: TouchEvent): boolean {
    if (e.touches.length === 0) return false;
    return this.joystick.isTouchInJoystickArea(e.touches[0]);
  }

  private _onMouseDown(e: MouseEvent): void {
    if (e.button === 0) {
      this.keys.mousePressed = true;
    }
  }

  private _onMouseUp(e: MouseEvent): void {
    if (e.button === 0) {
      this.keys.mousePressed = false;
    }
  }

  private _onKeyDown(e: KeyboardEvent): void {
    switch (e.code) {
      case "KeyW":
        this.keyboardInput.y = -1; // Forward
        break;
      case "KeyS":
        this.keyboardInput.y = 1; // Backward
        break;
      case "KeyA":
        this.keyboardInput.x = -1; // Left
        break;
      case "KeyD":
        this.keyboardInput.x = 1; // Right
        break;
      case "Shift":
        this.keys.shift = true;
        break;
      case "Space":
        this.keys.space = true;
        break;
    }
  }

  private _onKeyUp(e: KeyboardEvent): void {
    switch (e.code) {
      case "KeyW":
        if (this.keyboardInput.y === -1) this.keyboardInput.y = 0;
        break;
      case "KeyS":
        if (this.keyboardInput.y === 1) this.keyboardInput.y = 0;
        break;
      case "KeyA":
        if (this.keyboardInput.x === -1) this.keyboardInput.x = 0;
        break;
      case "KeyD":
        if (this.keyboardInput.x === 1) this.keyboardInput.x = 0;
        break;
      case "Shift":
        this.keys.shift = false;
        break;
      case "Space":
        this.keys.space = false;
        break;
    }
  }
} 