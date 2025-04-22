import { AnimationMixer, LoopOnce, Quaternion, Vector3 } from "three";
import { Characters } from "../components/Characters";
import { TouchJoystick } from "../components/TouchJoystick";
import {
  CharacterAnimationName,
  CharacterAnimations,
  isValidAnimationName,
} from "../config/types";

/**
 * Proxy class that holds character animations for the state machine.
 * This class acts as a bridge between the character controller and the animation system.
 */
class BasicCharacterControllerProxy {
  /**
   * Creates a new animation proxy.
   * @param animations - A record of animation names to their corresponding animation data
   */
  constructor(public animations: CharacterAnimations) {}
}

/**
 * Type definition for any input
 */
interface CharacterInput {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
  space: boolean;
  shift: boolean;
  mousePressed: boolean;
}

export class BasicCharatterController {
  private _input = new BasicCharatterControllerInput();
  private _stateMachine: CharaterStateMachine;
  private _acceleration = new Vector3(1, 0.25, 50.0);
  private _decceleration = new Vector3(-0.0005, -0.0001, -5.0);
  private _velocity = new Vector3(0, 0, 0);
  private _animations: CharacterAnimations;
  private _mixer: AnimationMixer;
  private _position = new Vector3();
  private _rotation = new Quaternion();

  constructor(private _character: Characters) {
    this._mixer = new AnimationMixer(this._character);

    this._animations = this._character.animations.reduce((acc, animation) => {
      const name = animation.name as CharacterAnimationName;
      console.assert(
        isValidAnimationName(name),
        `Animation ${name} not found in character animations`
      );
      acc[name] = {
        clip: animation,
        action: this._mixer.clipAction(animation),
      };
      return acc;
    }, {} as CharacterAnimations);

    this._stateMachine = new CharaterStateMachine(
      new BasicCharacterControllerProxy(this._animations)
    );

    this._stateMachine.setState("Idle");

    this._position.copy(this._character.position);
    this._rotation.copy(this._character.quaternion);

    // Log per debug
    console.log("BasicCharatterController initialized", {
      characterPosition: this._character.position,
      characterRotation: this._character.quaternion,
    });
  }

  public get position(): Vector3 {
    // Update position from character
    this._position.copy(this._character.position);
    return this._position;
  }

  public get rotation(): Quaternion {
    if (!this._character) {
      return new Quaternion();
    }
    // Update rotation from character
    this._rotation.copy(this._character.quaternion);
    return this._rotation;
  }

  /**
   * Updates the character controller state and animations.
   * Handles movement, rotation and state transitions based on input.
   * @param timeInSeconds - The time elapsed since last update in seconds
   */
  update(timeInSeconds: number) {
    if (!this._character) {
      return;
    }

    this._stateMachine.update(timeInSeconds, this._input);

    const velocity = this._velocity;
    const frameDecceleration = new Vector3(
      velocity.x * this._decceleration.x,
      velocity.y * this._decceleration.y,
      velocity.z * this._decceleration.z
    );
    frameDecceleration.multiplyScalar(timeInSeconds);
    frameDecceleration.z =
      Math.sign(frameDecceleration.z) *
      Math.min(Math.abs(frameDecceleration.z), Math.abs(velocity.z));

    velocity.add(frameDecceleration);

    const controlObject = this._character;
    const _Q = new Quaternion();
    const _A = new Vector3();
    const _R = controlObject.quaternion.clone();

    const acc = this._acceleration.clone();
    if (this._input.keys.shift) {
      acc.multiplyScalar(2.0);
    }

    if (this._stateMachine.currentState?.name == "Sword") {
      acc.multiplyScalar(0.0);
    }

    if (this._input.keys.forward) {
      velocity.z += acc.z * timeInSeconds;
    }
    if (this._input.keys.backward) {
      velocity.z -= acc.z * timeInSeconds;
    }
    if (this._input.keys.left) {
      _A.set(0, 1, 0);
      _Q.setFromAxisAngle(
        _A,
        4.0 * Math.PI * timeInSeconds * this._acceleration.y
      );
      _R.multiply(_Q);
    }
    if (this._input.keys.right) {
      _A.set(0, 1, 0);
      _Q.setFromAxisAngle(
        _A,
        4.0 * -Math.PI * timeInSeconds * this._acceleration.y
      );
      _R.multiply(_Q);
    }

    controlObject.quaternion.copy(_R);

    const oldPosition = new Vector3();
    oldPosition.copy(controlObject.position);

    const forward = new Vector3(0, 0, 1);
    forward.applyQuaternion(controlObject.quaternion);
    forward.normalize();

    const sideways = new Vector3(1, 0, 0);
    sideways.applyQuaternion(controlObject.quaternion);
    sideways.normalize();

    sideways.multiplyScalar(velocity.x * timeInSeconds);
    forward.multiplyScalar(velocity.z * timeInSeconds);

    controlObject.position.add(forward);
    controlObject.position.add(sideways);

    // Aggiorna la posizione e la rotazione
    this._position.copy(controlObject.position);
    this._rotation.copy(controlObject.quaternion);

    if (this._mixer) {
      this._mixer.update(timeInSeconds);
    }

    // Log per debug (solo ogni 60 frame per non sovraccaricare la console)
    if (Math.random() < 0.01) {
      console.log("Character update", {
        characterPosition: this._character.position,
        characterRotation: this._character.quaternion,
        velocity: velocity,
      });
    }
  }
}

export class BasicCharatterControllerInput {
  public keys: CharacterInput = {
    forward: false,
    backward: false,
    left: false,
    right: false,
    space: false,
    shift: false,
    mousePressed: false,
  };

  private touchStartX: number = 0;
  private touchStartY: number = 0;
  private readonly TOUCH_THRESHOLD = 30;
  private joystick: TouchJoystick;

  constructor() {
    document.addEventListener("keydown", (e) => this._onKeyDown(e), false);
    document.addEventListener("keyup", (e) => this._onKeyUp(e), false);
    document.addEventListener("mousedown", (e) => this._onMouseDown(e), false);
    document.addEventListener("mouseup", (e) => this._onMouseUp(e), false);
    
    // Initialize joystick
    // this.joystick = new TouchJoystick();
    
    // Add touch event listeners for non-joystick areas
    document.addEventListener("touchstart", (e) => this._onTouchStart(e), false);
    document.addEventListener("touchmove", (e) => this._onTouchMove(e), false);
    document.addEventListener("touchend", (e) => this._onTouchEnd(e), false);
  }

  private _onTouchStart(e: TouchEvent): void {
    e.preventDefault();
    if (e.touches.length === 1) {
      this.touchStartX = e.touches[0].clientX;
      this.touchStartY = e.touches[0].clientY;
    }
  }

  private _onTouchMove(e: TouchEvent): void {
    e.preventDefault();
    if (e.touches.length === 1) {
      const touchX = e.touches[0].clientX;
      const touchY = e.touches[0].clientY;
      
      const deltaX = touchX - this.touchStartX;
      const deltaY = touchY - this.touchStartY;

      // Get joystick values
      const joystickValues = this.joystick.getJoystickValues();
      
      // Reset movement keys
      this.keys.forward = false;
      this.keys.backward = false;
      this.keys.left = false;
      this.keys.right = false;

      // Apply joystick movement
      if (joystickValues.y < -0.3) this.keys.forward = true;
      if (joystickValues.y > 0.3) this.keys.backward = true;
      if (joystickValues.x < -0.3) this.keys.left = true;
      if (joystickValues.x > 0.3) this.keys.right = true;

    }
  }

  private _onTouchEnd(e: TouchEvent): void {
    e.preventDefault();
    // Reset all movement keys
    this.keys.forward = false;
    this.keys.backward = false;
    this.keys.left = false;
    this.keys.right = false;
    this.keys.space = false;
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
      case "Shift":
        this.keys.shift = false;
        break;
      case "Space":
        this.keys.space = false;
        break;
    }
  }
}

export class FiniteStateMachine {
  private _states: Record<
    CharacterAnimationName,
    new (parent: FiniteStateMachine) => CharacterState
  > = {} as Record<
    CharacterAnimationName,
    new (parent: FiniteStateMachine) => CharacterState
  >;
  public currentState: CharacterState | null;
  public proxy!: BasicCharacterControllerProxy;

  constructor() {
    this.currentState = null;
  }

  _addState(
    name: CharacterAnimationName,
    type: new (parent: FiniteStateMachine) => CharacterState
  ) {
    this._states[name] = type;
  }

  setState(name: CharacterAnimationName) {
    const prevState = this.currentState;

    if (prevState) {
      if (prevState.name == name) {
        return;
      }
      prevState.exit();
    }

    const state = new this._states[name](this);

    this.currentState = state;

    if (prevState) {
      state.enter(prevState);
    }
  }

  update(timeElapsed: number, input: BasicCharatterControllerInput) {
    if (this.currentState) {
      this.currentState.update(timeElapsed, input);
    }
  }
}

class CharaterStateMachine extends FiniteStateMachine {
  constructor(public proxy: BasicCharacterControllerProxy) {
    super();
    this._init();
  }

  _init() {
    this._addState("Idle", IdleState);
    this._addState("Walk", WalkState);
    this._addState("Death", DeathState);
    this._addState("Duck", DuckState);
    this._addState("HitReact", HitReactState);
    this._addState("Jump", JumpState);
    this._addState("Jump_Idle", JumpIdleState);
    this._addState("Jump_Land", JumpLandState);
    this._addState("No", NoState);
    this._addState("Punch", PunchState);
    this._addState("Run", RunState);
    this._addState("Sword", SwordState);
    this._addState("Wave", WaveState);
    this._addState("Yes", YesState);
  }
}

export abstract class CharacterState {
  public abstract get name(): CharacterAnimationName;

  constructor(protected _parent: FiniteStateMachine) {}

  private __finishedCallback = () => {
    this._finished();
  };

  private __cleanupCallback = () => {
    this._cleanup();
  };

  enter(prevState: CharacterState) {
    const curAction = this._parent.proxy.animations[this.name].action;
    const mixer = curAction.getMixer();
    mixer.addEventListener("finished", this.__finishedCallback);

    if (prevState) {
      const prevAction = this._parent.proxy.animations[prevState.name].action;

      curAction.reset();
      curAction.setLoop(LoopOnce, 1);
      curAction.clampWhenFinished = true;
      curAction.crossFadeFrom(prevAction, 0.5, true);
      curAction.play();
    } else {
      curAction.play();
    }
  }

  _finished() {
    this._cleanup();
    this._parent.setState("Idle");
  }

  _cleanup() {
    const action = this._parent.proxy.animations[this.name].action;

    action.getMixer().removeEventListener("finished", this.__cleanupCallback);
  }

  exit() {
    this._cleanup();
  }

  update(timeElapsed: number, input: BasicCharatterControllerInput): void {}
}

export class IdleState extends CharacterState {
  public get name(): CharacterAnimationName {
    return "Idle";
  }
  enter(prevState: CharacterState): void {
    const idleAction = this._parent.proxy.animations["Idle"].action;
    if (prevState) {
      const prevAction = this._parent.proxy.animations[prevState.name].action;
      idleAction.time = 0.0;
      idleAction.enabled = true;
      idleAction.setEffectiveTimeScale(1.0);
      idleAction.setEffectiveWeight(1.0);
      idleAction.crossFadeFrom(prevAction, 0.5, true);
      idleAction.play();
    } else {
      idleAction.play();
    }
  }

  exit(): void {}

  update(timeElapsed: number, input: BasicCharatterControllerInput): void {
    if (input.keys.forward || input.keys.backward) {
      this._parent.setState("Walk");
    } else if (input.keys.space) {
      this._parent.setState("Jump");
    } else if (input.keys.mousePressed) {
      this._parent.setState("Sword");
    }
  }
}

export class RunState extends CharacterState {
  get name(): CharacterAnimationName {
    return "Run";
  }

  enter(prevState: CharacterState) {
    const curAction = this._parent.proxy.animations["Run"].action;
    if (prevState) {
      const prevAction = this._parent.proxy.animations[prevState.name].action;

      curAction.enabled = true;

      if (prevState.name == "Walk") {
        const ratio =
          curAction.getClip().duration / prevAction.getClip().duration;
        curAction.time = prevAction.time * ratio;
      } else {
        curAction.time = 0.0;
        curAction.setEffectiveTimeScale(1.0);
        curAction.setEffectiveWeight(1.0);
      }

      curAction.crossFadeFrom(prevAction, 0.5, true);
      curAction.play();
    } else {
      curAction.play();
    }
  }

  exit(): void {}

  update(timeElapsed: number, input: BasicCharatterControllerInput) {
    if (input.keys.forward || input.keys.backward) {
      if (!input.keys.shift) {
        this._parent.setState("Walk");
      }
      return;
    }

    this._parent.setState("Idle");
  }
}

export class SwordState extends CharacterState {
  private _finishedCallback = () => {
    this._finished();
  };

  private _cleanupCallback = () => {
    this._cleanup();
  };

  get name(): CharacterAnimationName {
    return "Sword";
  }

  enter(prevState: CharacterState) {
    const curAction = this._parent.proxy.animations["Sword"].action;
    const mixer = curAction.getMixer();
    mixer.addEventListener("finished", this._finishedCallback);

    if (prevState) {
      const prevAction = this._parent.proxy.animations[prevState.name].action;

      curAction.reset();
      curAction.setLoop(LoopOnce, 1);
      curAction.clampWhenFinished = true;
      curAction.crossFadeFrom(prevAction, 0.5, true);
      curAction.play();
    } else {
      curAction.play();
    }
  }

  _finished() {
    this._cleanup();
    this._parent.setState("Idle");
  }

  _cleanup() {
    const action = this._parent.proxy.animations["Sword"].action;

    action.getMixer().removeEventListener("finished", this._cleanupCallback);
  }

  exit() {
    this._cleanup();
  }

  update(_: number) {}
}

export class WalkState extends CharacterState {
  get name(): CharacterAnimationName {
    return "Walk";
  }

  enter(prevState: CharacterState) {
    const curAction = this._parent.proxy.animations["Walk"].action;
    if (prevState) {
      const prevAction = this._parent.proxy.animations[prevState.name].action;

      curAction.enabled = true;
      if (prevState.name == "Run") {
        const ratio =
          curAction.getClip().duration / prevAction.getClip().duration;
        curAction.time = prevAction.time * ratio;
      } else {
        curAction.time = 0.0;
        curAction.setEffectiveTimeScale(1.0);
        curAction.setEffectiveWeight(1.0);
      }

      curAction.crossFadeFrom(prevAction, 0.5, true);
      curAction.play();
    } else {
      curAction.play();
    }
  }

  update(timeElapsed: number, input: BasicCharatterControllerInput) {
    if (input.keys.forward || input.keys.backward) {
      if (input.keys.shift) {
        this._parent.setState("Run");
      }
      return;
    }

    this._parent.setState("Idle");
  }
}

// TODO: Implement custom zone the following states

export class DeathState extends CharacterState {
  get name(): CharacterAnimationName {
    return "Death";
  }
}

export class DuckState extends CharacterState {
  get name(): CharacterAnimationName {
    return "Duck";
  }
}

export class HitReactState extends CharacterState {
  get name(): CharacterAnimationName {
    return "HitReact";
  }
}

export class JumpState extends CharacterState {
  get name(): CharacterAnimationName {
    return "Jump";
  }

  enter(prevState: CharacterState) {
    const curAction = this._parent.proxy.animations["Jump"].action;
    const mixer = curAction.getMixer();
    mixer.addEventListener("finished", this._finishedCallback);

    if (prevState) {
      const prevAction = this._parent.proxy.animations[prevState.name].action;

      curAction.reset();
      curAction.setLoop(LoopOnce, 1);
      curAction.clampWhenFinished = true;
      curAction.crossFadeFrom(prevAction, 0.5, true);
      curAction.play();
    } else {
      curAction.play();
    }
  }

  update(timeElapsed: number, input: BasicCharatterControllerInput): void {
  
   }

  exit(): void {
    const curAction = this._parent.proxy.animations["Jump"].action;
    curAction.stop();
  }
  _cleanup(): void {
    const action = this._parent.proxy.animations["Jump"].action;
    action.getMixer().removeEventListener("finished", this._cleanupCallback);
  }
  _finished(): void {
    this._cleanup();
    this._parent.setState("Jump_Idle");
  }
  private _finishedCallback = () => {
    this._finished();
  };
  private _cleanupCallback = () => {
    this._cleanup();
  };
}

export class JumpIdleState extends CharacterState {
  get name(): CharacterAnimationName {
    return "Jump_Idle";
  }
}

export class JumpLandState extends CharacterState {
  get name(): CharacterAnimationName {
    return "Jump_Land";
  }
}

export class NoState extends CharacterState {
  get name(): CharacterAnimationName {
    return "No";
  }
}

export class PunchState extends CharacterState {
  get name(): CharacterAnimationName {
    return "Punch";
  }
}

export class WaveState extends CharacterState {
  get name(): CharacterAnimationName {
    return "Wave";
  }
}

export class YesState extends CharacterState {
  get name(): CharacterAnimationName {
    return "Yes";
  }
}
