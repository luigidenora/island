import classes from "./virtual-joystick.module.css";
export const isMobile = () => {
  return /Mobi|Android|iPhone|iPad|iPod|BlackBerry|Windows Phone|webOS/i.test(navigator.userAgent);
};
/**
 * A virtual joystick for touch devices that provides normalized directional input.
 * This implementation is more robust and handles edge cases better.
 */
export class VirtualJoystick {
  public isVisible: boolean = false;
  private container!: HTMLDivElement;
  private joystick!: HTMLDivElement;
  private buttonsContainer!: HTMLDivElement;
  private isActive: boolean = false;
  private startX: number = 0;
  private startY: number = 0;
  private currentX: number = 0;
  private currentY: number = 0;
  private readonly maxDistance: number = 50;
  private readonly deadZone: number = 0.1; // Dead zone to prevent tiny movements
  private readonly smoothingFactor: number = 0.2; // For smooth transitions
  private smoothedX: number = 0;
  private smoothedY: number = 0;
  private eventTarget: EventTarget = new EventTarget();

  constructor() {
    if (isMobile()) {
      // Create container
      this.container = document.createElement("div");
      this.container.id = "joystickContainer";
      this.container.className = classes.joystickContainer;

      // Create joystick
      this.joystick = document.createElement("div");
      this.joystick.id = "joystick";
      this.joystick.className = classes.joystick;

      this.container.appendChild(this.joystick);

      // Create buttons container
      this.buttonsContainer = document.createElement("div");
      this.buttonsContainer.id = "buttonsContainer";
      this.buttonsContainer.className = classes.buttonsContainer;

      // Add buttons for sword and jump actions
      const swordButton = this._createButton("swordButton", "Sword");
      const jumpButton = this._createButton("jumpButton", "Jump");

      this.buttonsContainer.appendChild(swordButton);
      this.buttonsContainer.appendChild(jumpButton);

      // Append containers to the body
      document.body.appendChild(this.container);
      document.body.appendChild(this.buttonsContainer);

      // Add event listeners
      this.container.addEventListener(
        "touchstart",
        (e) => this._onTouchStart(e),
        { passive: false }
      );
      this.container.addEventListener("touchmove", (e) => this._onTouchMove(e), {
        passive: false,
      });
      this.container.addEventListener("touchend", (e) => this._onTouchEnd(e), {
        passive: false,
      });
      this.container.addEventListener("touchcancel", (e) => this._onTouchEnd(e), {
        passive: false,
      });

      swordButton.addEventListener("touchstart", () => {
        const event = new CustomEvent("swordaction");
        this.eventTarget.dispatchEvent(event);
      });

      swordButton.addEventListener("touchstart", () => {
        const event = new CustomEvent("sword");
        this.eventTarget.dispatchEvent(event);
      });

      jumpButton.addEventListener("touchstart", () => {
        const event = new CustomEvent("jump");
        this.eventTarget.dispatchEvent(event);
      });

      // Show joystick only on touch devices

      this.setVisible(true);
    }
  }

  /**
   * Creates a button element with the given id and label
   */
  private _createButton(id: string, label: string): HTMLDivElement {
    const button = document.createElement("div");
    button.id = id;
    button.className = classes.gameboyButton;
    button.classList.add(classes[id]);
    return button;
  }

  /**
   * Emits a custom event for joystick movement
   */
  private _emitJoystickEvent(
    type: string,
    detail: { x: number; y: number }
  ): void {
    const event = new CustomEvent(type, { detail });
    this.eventTarget.dispatchEvent(event);
  }

  /**
   * Emits a custom event for character input based on joystick movement
   */
  private _emitCharacterInputEvent(): void {
    const joystickValues = this.getJoystickValues();

    const event = new CustomEvent("characterinput", {
      detail: {
        forward: joystickValues.y < -0.5,
        backward: joystickValues.y > 0.5,
        left: joystickValues.x < -0.5,
        right: joystickValues.x > 0.5,
      },
    });

    this.eventTarget.dispatchEvent(event);
  }

  public addEventListener(
    type: string,
    callback: EventListenerOrEventListenerObject | null,
    options?: AddEventListenerOptions | boolean
  ): void {
    this.eventTarget.addEventListener(type, callback, options);
  }

  /**
   * Handles touch start events
   */
  private _onTouchStart(e: TouchEvent): void {
    e.preventDefault();
    e.stopPropagation();

    if (e.touches.length === 1) {
      this.isActive = true;
      const touch = e.touches[0];
      const rect = this.container.getBoundingClientRect();

      // Calculate the center of the container
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      // Store the initial touch position
      this.startX = touch.clientX - centerX;
      this.startY = touch.clientY - centerY;

      // Update joystick position
      this._updateJoystickPosition(this.startX, this.startY);
    }
  }

  /**
   * Handles touch move events
   */
  private _onTouchMove(e: TouchEvent): void {
    if (!this.isActive) return;

    e.preventDefault();
    e.stopPropagation();

    if (e.touches.length === 1) {
      const touch = e.touches[0];
      const rect = this.container.getBoundingClientRect();

      // Calculate the center of the container
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      // Calculate the current position relative to the center
      this.currentX = touch.clientX - centerX;
      this.currentY = touch.clientY - centerY;

      // If vertical movement is more significant, reduce horizontal movement
      if (Math.abs(this.currentY) > Math.abs(this.currentX)) {
        this.currentX *= 0.3; // Reduce horizontal influence when moving vertically
      }

      // Update joystick position
      this._updateJoystickPosition(this.currentX, this.currentY);
    }
  }

  /**
   * Handles touch end events
   */
  private _onTouchEnd(e: TouchEvent): void {
    e.preventDefault();
    e.stopPropagation();

    this.isActive = false;
    this._updateJoystickPosition(0, 0);
  }

  /**
   * Updates the joystick's visual position and emits movement and character input events
   */
  private _updateJoystickPosition(x: number, y: number): void {
    // Calculate distance from center
    const distance = Math.sqrt(x * x + y * y);

    // If distance is greater than maxDistance, normalize the position
    if (distance > this.maxDistance) {
      x = (x / distance) * this.maxDistance;
      y = (y / distance) * this.maxDistance;
    }

    // Update joystick element position
    this.joystick.style.transform = `translate(${x}px, ${y}px)`;

    // Emit movement and character input events
    const normalizedX = x / this.maxDistance;
    const normalizedY = y / this.maxDistance;
    this._emitJoystickEvent("joystickmove", { x: normalizedX, y: normalizedY });
    this._emitCharacterInputEvent();

    if (!this.isActive) {
      this._emitJoystickEvent("joystickstop", { x: 0, y: 0 });
    }
  }

  /**
   * Returns the current joystick values as normalized coordinates
   * @returns {Object} An object with x and y values between -1 and 1
   */
  public getJoystickValues(): { x: number; y: number } {
    if (!this.isActive) {
      // Apply smoothing when not active
      this.smoothedX *= 1 - this.smoothingFactor;
      this.smoothedY *= 1 - this.smoothingFactor;

      // If values are very small, set them to zero
      if (Math.abs(this.smoothedX) < 0.01) this.smoothedX = 0;
      if (Math.abs(this.smoothedY) < 0.01) this.smoothedY = 0;

      return { x: this.smoothedX, y: this.smoothedY };
    }

    // Calculate normalized values
    let x = this.currentX / this.maxDistance;
    let y = this.currentY / this.maxDistance;

    // Apply dead zone
    if (Math.abs(x) < this.deadZone) x = 0;
    if (Math.abs(y) < this.deadZone) y = 0;

    // Apply smoothing
    this.smoothedX += (x - this.smoothedX) * this.smoothingFactor;
    this.smoothedY += (y - this.smoothedY) * this.smoothingFactor;

    return { x: this.smoothedX, y: this.smoothedY };
  }

  /**
   * Shows or hides the joystick
   */
  public setVisible(visible: boolean): void {
    this.isVisible = visible;

    if (!visible) {
      // Reset joystick when hiding
      this.isActive = false;
      this.smoothedX = 0;
      this.smoothedY = 0;
    }
  }

  /**
   * Returns whether the joystick is currently visible
   */
  public isJoystickVisible(): boolean {
    return this.isVisible;
  }

  /**
   * Checks if a touch event is within the joystick area
   */
  public isTouchInJoystickArea(touch: Touch): boolean {
    const rect = this.container.getBoundingClientRect();
    return (
      touch.clientX >= rect.left &&
      touch.clientX <= rect.right &&
      touch.clientY >= rect.top &&
      touch.clientY <= rect.bottom
    );
  }
}
