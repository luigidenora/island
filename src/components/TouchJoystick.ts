export class TouchJoystick {
  private container: HTMLDivElement;
  private joystick: HTMLDivElement;
  private isActive: boolean = false;
  private startX: number = 0;
  private startY: number = 0;
  private currentX: number = 0;
  private currentY: number = 0;
  private readonly maxDistance: number = 50;

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
    this.container.style.display = 'none'; // Hidden by default, shown only on touch devices
    this.container.style.touchAction = 'none';

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

    this.container.appendChild(this.joystick);
    document.body.appendChild(this.container);

    // Add event listeners
    this.container.addEventListener('touchstart', this._onTouchStart.bind(this));
    this.container.addEventListener('touchmove', this._onTouchMove.bind(this));
    this.container.addEventListener('touchend', this._onTouchEnd.bind(this));

    // Show joystick only on touch devices
    if ('ontouchstart' in window) {
      this.container.style.display = 'block';
    }
  }

  private _onTouchStart(e: TouchEvent): void {
    e.preventDefault();
    this.isActive = true;
    const touch = e.touches[0];
    const rect = this.container.getBoundingClientRect();
    this.startX = touch.clientX - rect.left - rect.width / 2;
    this.startY = touch.clientY - rect.top - rect.height / 2;
    this._updateJoystickPosition(this.startX, this.startY);
  }

  private _onTouchMove(e: TouchEvent): void {
    if (!this.isActive) return;
    e.preventDefault();
    const touch = e.touches[0];
    const rect = this.container.getBoundingClientRect();
    this.currentX = touch.clientX - rect.left - rect.width / 2;
    this.currentY = touch.clientY - rect.top - rect.height / 2;
    this._updateJoystickPosition(this.currentX, this.currentY);
  }

  private _onTouchEnd(e: TouchEvent): void {
    e.preventDefault();
    this.isActive = false;
    this._updateJoystickPosition(0, 0);
  }

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

  public getJoystickValues(): { x: number; y: number } {
    if (!this.isActive) {
      return { x: 0, y: 0 };
    }
    return {
      x: this.currentX / this.maxDistance,
      y: this.currentY / this.maxDistance
    };
  }
} 