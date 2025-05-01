import { CharacterAnimator, BasicCharacterControllerProxy } from "./CharacterAnimator";
import { CharacterAnimationName } from "../config/types";

/**
 * Base class for all character states.
 */
export abstract class CharacterState {
  public abstract get name(): CharacterAnimationName;

  constructor(protected _parent: FiniteStateMachine) { }

  private __finishedCallback = () => {
    this._finished();
  };

  private __cleanupCallback = () => {
    this._cleanup();
  };

  /**
   * Called when entering this state.
   * @param prevState - The previous state
   */
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

  /**
   * Called when the animation finishes.
   */
  _finished() {
    this._cleanup();
    this._parent.setState("Idle");
  }

  /**
   * Cleans up event listeners.
   */
  _cleanup() {
    const action = this._parent.proxy.animations[this.name].action;
    action.getMixer().removeEventListener("finished", this.__cleanupCallback);
  }

  /**
   * Called when exiting this state.
   */
  exit() {
    this._cleanup();
  }

  /**
   * Updates the state based on input.
   * @param timeElapsed - The time elapsed since the last update in seconds
   * @param input - The input handler
   */
  update(timeElapsed: number, input: BasicCharacterInputHandler): void { }
}

/**
 * Base class for the finite state machine.
 */
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

  /**
   * Adds a state to the state machine.
   * @param name - The name of the state
   * @param type - The state class
   */
  _addState(
    name: CharacterAnimationName,
    type: new (parent: FiniteStateMachine) => CharacterState
  ) {
    this._states[name] = type;
  }

  /**
   * Sets the current state.
   * @param name - The name of the state to set
   */
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

  /**
   * Updates the current state.
   * @param timeElapsed - The time elapsed since the last update in seconds
   * @param input - The input handler
   */
  update(timeElapsed: number, input: BasicCharacterInputHandler) {
    if (this.currentState) {
      this.currentState.update(timeElapsed, input);
    }
  }
}

/**
 * Character state machine that manages all character states.
 */
export class HumanoidCharacterStateMachine extends FiniteStateMachine {
  constructor(animator: CharacterAnimator) {
    super();
    this.proxy = animator.proxy;
    this._init();
  }

  /**
   * Initializes all states.
   */
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
    this.setState("Idle");
  }
}
/**
 * Character state machine that manages all character states.
 */
export class SharkCharacterStateMachine extends FiniteStateMachine {
  constructor(animator: CharacterAnimator) {
    super();
    this.proxy = animator.proxy;
    this._init();
  }

  /**
   * Initializes all states.
   */
  _init() {
    this._addState("Swim", SwimState);
    this._addState("Idle", SwimState);
    this._addState("Walk", SwimState);
    this._addState("Swim_Fast", SwimFastState);
    this._addState("Swim_Bite", SwimBiteState);
    this.setState("Swim_Bite");
  }
}
// Import LoopOnce for the CharacterState class
import { LoopOnce } from "three";
import { BasicCharacterInputHandler } from "./CharacterInput";

// State implementations
export class IdleState extends CharacterState {
  public get name(): CharacterAnimationName {
    return "Idle";
  }

  enter(prevState: CharacterState): void {
    const idleAction = this._parent.proxy.animations[this.name].action;
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

  exit(): void { }

  update(timeElapsed: number, input: BasicCharacterInputHandler): void {
    if (input.keys.forward || input.keys.backward) {
      this._parent.setState("Walk");
    } else if (input.keys.jump) {
      this._parent.setState("Jump");
    } else if (input.keys.sword) {
      this._parent.setState("Sword");
    }
  }
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

  update(timeElapsed: number, input: BasicCharacterInputHandler) {
    if (input.keys.forward || input.keys.backward) {
      if (input.keys.run) {
        this._parent.setState("Run");
      } else if (input.keys.sword) {
        this._parent.setState("Sword");
      }
      return;
    }

    this._parent.setState("Idle");
  }
}



export class RunState extends CharacterState {
  get name(): CharacterAnimationName {
    return "Run";
  }

  enter(prevState: CharacterState) {
    const curAction = this._parent.proxy.animations[this.name].action;
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

  exit(): void { }

  update(timeElapsed: number, input: BasicCharacterInputHandler) {
    if (input.keys.forward || input.keys.backward) {
      if (!input.keys.run) {
        this._parent.setState("Walk");
      }
      else if (input.keys.sword) {
        this._parent.setState("Sword");
      }
      return;
    }

    this._parent.setState("Idle");
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

  update(timeElapsed: number, input: BasicCharacterInputHandler): void {
    // Jump state doesn't need to check for input as it's a one-time animation
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
    const curAction = this._parent.proxy.animations[this.name].action;
    const mixer = curAction.getMixer();
    mixer.addEventListener("finished", this._finishedCallback);

    if (prevState) {
      const prevAction = this._parent.proxy.animations[prevState.name].action;

      curAction.reset();
      curAction.setLoop(LoopOnce, 1);
      curAction.clampWhenFinished = true;
      curAction.crossFadeFrom(prevAction, 0.5, true);
      curAction.setEffectiveTimeScale(1.5);
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
    action.getMixer().removeEventListener("finished", this._cleanupCallback);
  }

  exit() {
    this._cleanup();
  }

  update(_: number) { }
}



export class DeathState extends CharacterState {
  private _finishedCallback = () => {
    this._finished();
  };

  private _cleanupCallback = () => {
    this._cleanup();
  };

  get name(): CharacterAnimationName {
    return "Death";
  }

  enter(prevState: CharacterState) {
    const curAction = this._parent.proxy.animations[this.name].action;
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
    // Death state is terminal, no transition to another state
  }

  _cleanup() {
    const action = this._parent.proxy.animations[this.name].action;
    action.getMixer().removeEventListener("finished", this._cleanupCallback);
  }

  exit() {
    this._cleanup();
  }

  update(_: number) {
    // Death state does not respond to input or update logic
  }
}

export class DuckState extends CharacterState {
  get name(): CharacterAnimationName {
    return "Duck";
  }
}

export class HitReactState extends CharacterState {
  private _finishedCallback = () => {
    this._finished();
  };

  private _cleanupCallback = () => {
    this._cleanup();
  };

  get name(): CharacterAnimationName {
    return "HitReact";
  }

  enter(prevState: CharacterState) {
    const curAction = this._parent.proxy.animations[this.name].action;
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
    const action = this._parent.proxy.animations[this.name].action;
    action.getMixer().removeEventListener("finished", this._cleanupCallback);
  }

  exit() {
    this._cleanup();
  }

  update(_: number) {
    // HitReact state does not respond to input or update logic
  }
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

//#region Shark States

export class SwimState extends WalkState {
  public get name(): CharacterAnimationName {
    return "Swim";
  }
  enter(prevState: CharacterState) {
    const curAction = this._parent.proxy.animations["Swim"].action;
    if (prevState) {
      const prevAction = this._parent.proxy.animations[prevState.name].action;

      curAction.enabled = true;
      if (prevState.name == "Swim_Fast") {
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
  exit(): void { }

  update(timeElapsed: number, input: BasicCharacterInputHandler): void {
    if (input.keys.forward || input.keys.backward) {
      if (input.keys.run) {
        this._parent.setState("Swim_Fast");
      }
    } if (input.keys.sword) {
      this._parent.setState("Swim_Bite");
    }

  }
}

export class SwimFastState extends CharacterState {
  get name(): CharacterAnimationName {
    return "Swim_Fast";
  }

  enter(prevState: CharacterState) {
    const curAction = this._parent.proxy.animations[this.name].action;
    if (prevState) {
      const prevAction = this._parent.proxy.animations[prevState.name].action;

      curAction.enabled = true;

      if (prevState.name == "Swim") {
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

  exit(): void { }

  update(timeElapsed: number, input: BasicCharacterInputHandler) {
    if (input.keys.forward || input.keys.backward) {
      if (!input.keys.run) {
        this._parent.setState("Swim");
      }
      else if (input.keys.sword) {
        this._parent.setState("Swim_Bite");
      }
      return;
    }

    this._parent.setState("Swim");
  }
}

export class SwimBiteState extends SwordState {

  override get name(): CharacterAnimationName {
    return "Swim_Bite";
  }

  override _finished(): void {
    this._cleanup();
    this._parent.setState("Swim")
  }

}
//# endregion SharkStates
