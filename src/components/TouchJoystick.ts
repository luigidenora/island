/**
 * A virtual joystick for touch devices that provides normalized directional input.
 * This implementation is more robust and handles edge cases better.
 */
export class TouchJoystick {
  private container: HTMLDivElement;
  private joystick: HTMLDivElement;
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
  private isVisible: boolean = false;

  constructor() {
    // Create container
    this.container = document.createElement('div');
    this.container.style.position = 'fixed';
    this.container.style.bottom = '20px';
    this.container.style.left = '20px';
    this.container.style.width = '150px';
    this.container.style.height = '150px';
    this.container.style.backgroundColor = 'rgba(0, 0, 0, 0.2)';
    this.container.style.borderRadius = '50%';
    this.container.style.display = 'none'; // Hidden by default
    this.container.style.touchAction = 'none';
    this.container.style.zIndex = '1000';
    this.container.style.userSelect = 'none';
    this.container.style.webkitUserSelect = 'none';

    // Create joystick
    this.joystick = document.createElement('div');
    this.joystick.style.position = 'absolute';
    this.joystick.style.width = '50px';
    this.joystick.style.height = '50px';
    this.joystick.style.backgroundColor = 'rgba(255, 255, 255, 0.5)';
    this.joystick.style.borderRadius = '50%';
    this.joystick.style.top = '50%';
    this.joystick.style.left = '50%';
    this.joystick.style.transform = 'translate(-50%, -50%)';
    this.joystick.style.touchAction = 'none';
    this.joystick.style.boxShadow = '0 0 10px rgba(0, 0, 0, 0.3)';
    this.joystick.style.transition = 'background-color 0.2s';

    this.container.appendChild(this.joystick);
    document.body.appendChild(this.container);

    // Add event listeners
    this.container.addEventListener('touchstart', (e) => this._onTouchStart(e), { passive: false });
    this.container.addEventListener('touchmove', (e) => this._onTouchMove(e), { passive: false }); 
    this.container.addEventListener('touchend', (e) => this._onTouchEnd(e), { passive: false });
    this.container.addEventListener('touchcancel', (e) => this._onTouchEnd(e), { passive: false });

    // Show joystick only on touch devices
    if ('ontouchstart' in window) {
      this.isVisible = true;
      this.container.style.display = 'block';
    }
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
      
      // Visual feedback
      this.joystick.style.backgroundColor = 'rgba(255, 255, 255, 0.7)';
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
    
    // Visual feedback
    this.joystick.style.backgroundColor = 'rgba(255, 255, 255, 0.5)';
  }

  /**
   * Updates the joystick's visual position
   */
  private _updateJoystickPosition(x: number, y: number): void {
    // Calculate distance from center
    const distance = Math.sqrt(x * x + y * y);
    
    // If distance is greater than maxDistance, normalize the position
    if (distance > this.maxDistance) {
      x = (x / distance) * this.maxDistance;
      y = (y / distance) * this.maxDistance;
    }

    // Update joystick position
    this.joystick.style.transform = `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`;
  }

  /**
   * Returns the current joystick values as normalized coordinates
   * @returns {Object} An object with x and y values between -1 and 1
   */
  public getJoystickValues(): { x: number; y: number } {
    if (!this.isActive) {
      // Apply smoothing when not active
      this.smoothedX *= (1 - this.smoothingFactor);
      this.smoothedY *= (1 - this.smoothingFactor);
      
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
    this.container.style.display = visible ? 'block' : 'none';
    
    if (!visible) {
      // Reset joystick when hiding
      this.isActive = false;
      this._updateJoystickPosition(0, 0);
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