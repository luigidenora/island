import { AnimationMixer, LoopOnce, Vector3 } from "three";
import { Characters } from "../components/Characters";
import { CharacterAnimationName, CharacterAnimations, isValidAnimationName } from "../config/types";

/**
 * Proxy class that holds character animations for the state machine.
 * This class acts as a bridge between the character controller and the animation system.
 */
class BasicCharacterControllerProxy {
  /**
   * Creates a new animation proxy.
   * @param animations - A record of animation names to their corresponding animation data
   */
  constructor(public animations: CharacterAnimations) {
  }
};

/**
 * Type definition for keyboard input state
 */
interface CharacterInputKeys {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
  space: boolean;
  shift: boolean;
}

export class BasicCharatterController {
  private _input = new BasicCharatterControllerInput();
  private _stateMachine: CharaterStateMachine;
  private _acceleration = new Vector3(1, 0.25, 50.0);
  private _decceleration = new Vector3(-0.0005, -0.0001, -5.0);
  private _velocity = new Vector3(0, 0, 0);
  private _animations: CharacterAnimations;
  private _mixer: AnimationMixer

  constructor(private _character: Characters) {
    this._mixer = new AnimationMixer(this._character.children[0]);
    this._animations = this._character.animations.reduce((acc, animation) => {
      const name = animation.name as CharacterAnimationName;
      console.assert(isValidAnimationName(name), `Animation ${name} not found in character animations`);
      acc[name] = {
        clip: animation,
        action: this._mixer.clipAction(animation)
      };
      return acc;
    }, {} as CharacterAnimations);

    this._stateMachine = new CharaterStateMachine(new BasicCharacterControllerProxy(this._animations));
  }

}

export class BasicCharatterControllerInput {
  private _keys: CharacterInputKeys = {
    forward: false,
    backward: false,
    left: false,
    right: false,
    space: false,
    shift: false,
  }

  constructor() {
    document.addEventListener('keydown', (e) => this._onKeyDown(e), false);
    document.addEventListener('keyup', (e) => this._onKeyUp(e), false);
  }

  private _onKeyDown(e: KeyboardEvent): void {
    switch (e.code) {
      case 'KeyW':
        this._keys.forward = true;
        break;
      case 'KeyS':
        this._keys.backward = true;
        break;
      case 'KeyA':
        this._keys.left = true;
        break;
      case 'KeyD':
        this._keys.right = true;
        break;
      case 'Shift':
        this._keys.shift = true
        break;
      case 'Space':
        this._keys.space = true
        break;
    }
  }

  private _onKeyUp(e: KeyboardEvent): void {
    switch (e.code) {
      case 'KeyW':
        this._keys.forward = false;
        break;
      case 'KeyS':
        this._keys.backward = false;
        break;
      case 'KeyA':
        this._keys.left = false;
        break;
      case 'KeyD':
        this._keys.right = false;
        break;
      case 'Shift':
        this._keys.shift = false
        break;
      case 'Space':
        this._keys.space = false
        break;
    }
  }
}


export class FiniteStateMachine {
  private _states: Record<CharacterAnimationName, new (parent: FiniteStateMachine) => CharacterState> = {} as Record<CharacterAnimationName, new (parent: FiniteStateMachine) => CharacterState>;
  private _currentState: CharacterState | null;
  public _proxy!: BasicCharacterControllerProxy;

  constructor() {
    this._currentState = null;
  }

  _addState(name: CharacterAnimationName, type: new (parent: FiniteStateMachine) => CharacterState) {
    this._states[name] = type;
  }

  setState(name: CharacterAnimationName) {

    const prevState = this._currentState;

    if (prevState) {
      if (prevState.name == name) {
        return;
      }
      prevState.exit();
    }

    const state = new this._states[name](this);

    this._currentState = state;

    if(prevState) {
      state.enter(prevState);
    } 

  }

  update(timeElapsed: number, input: CharacterInputKeys) {
    if (this._currentState) {
      this._currentState.update(timeElapsed, input);
    }
  }
}

class CharaterStateMachine extends FiniteStateMachine {
  constructor(public _proxy: BasicCharacterControllerProxy) {
    super();
    this._init();
  }

  _init() {
    this._addState('Death', DeathState);
    this._addState('Duck', DuckState);
    this._addState('HitReact', HitReactState);
    this._addState('Idle', IdleState);
    this._addState('Jump', JumpState);
    this._addState('Jump_Idle', JumpIdleState);
    this._addState('Jump_Land', JumpLandState);
    this._addState('No', NoState);
    this._addState('Punch', PunchState);
    this._addState('Run', RunState);
    this._addState('Sword', SwordState);
    this._addState('Walk', WalkState);
    this._addState('Wave', WaveState);
    this._addState('Yes', YesState);
  }
}


export abstract class CharacterState {

  public abstract get name(): CharacterAnimationName;

  constructor(protected _parent: FiniteStateMachine) {
  }

  enter(prevState: CharacterState): void {
  }
  exit(): void {
  }
  update(timeElapsed: number, input: CharacterInputKeys): void {
  }
}

export class IdleState extends CharacterState {
  public get name(): CharacterAnimationName {
    return 'Idle'
  }
  enter(prevState: CharacterState): void {
    const idleAction = this._parent._proxy.animations['Idle'].action;
    if (prevState) {
      const prevAction = this._parent._proxy.animations[prevState.name].action;
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

  exit(): void {
  }

  update(timeElapsed: number, input: any): void {
    if (input._move.forward || input._move.backward) {
      this._parent.setState('Walk');
    } else if (input._move.space) {
      this._parent.setState('Sword');
    }
  }

}

export class RunState extends CharacterState {
  exit(): void {
    throw new Error("Method not implemented.");
  }
  get name(): CharacterAnimationName { return 'Run' }

  enter(prevState: CharacterState) {
    const curAction = this._parent._proxy.animations['Run'].action;
    if (prevState) {
      const prevAction = this._parent._proxy.animations[prevState.name].action;

      curAction.enabled = true;
      if (prevState.name == 'Walk') {
        const ratio = curAction.getClip().duration / prevAction.getClip().duration;
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

  update(timeElapsed: number, input:any) {
    if (input._move.forward || input._move.backward) {
      if (!input._move.shift) {
        this._parent.setState('Walk');
      }
      return;
    }

    this._parent.setState('Idle');
  }
}

export class SwordState extends CharacterState {
  get name(): CharacterAnimationName { return 'Sword' }

  enter(prevState: CharacterState) {
    const curAction = this._parent._proxy.animations['Sword'].action;
    const mixer = curAction.getMixer();
    mixer.addEventListener('finished', this._finishedCallback);

    if (prevState) {
      const prevAction = this._parent._proxy.animations[prevState.name].action;

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
    this._parent.setState('Idle');
  }

  _cleanup() {
    const action = this._parent._proxy.animations['Sword'].action;

    action.getMixer().removeEventListener('finished', this._cleanupCallback);
  }


  exit() {
    this._cleanup();
  }

  update(_: number) {
  }
}

export class WalkState extends CharacterState {
 
  get name(): CharacterAnimationName { return 'Walk' }

  enter(prevState: CharacterState) {
    const curAction = this._parent._proxy.animations['Walk'].action;
    if (prevState) {
      const prevAction = this._parent._proxy.animations[prevState.name].action;

      curAction.enabled = true;
      if (prevState.name == 'Run') {
        const ratio = curAction.getClip().duration / prevAction.getClip().duration;
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


  update(timeElapsed: number, input: any) {
    if (input._move.forward || input._move.backward) {
      if (input._move.shift) {
        this._parent.setState('Run');
      }
      return;
    }

    this._parent.setState('Idle');
  }
}

// TODO: Implement custom zone the following states

export class DeathState extends CharacterState {
  get name(): CharacterAnimationName { return 'Death' }

}

export class DuckState extends CharacterState {
  get name(): CharacterAnimationName { return 'Duck' }
}

export class HitReactState extends CharacterState {
  get name(): CharacterAnimationName { return 'HitReact' }
}

export class JumpState extends CharacterState {
  get name(): CharacterAnimationName { return 'Jump' }
}

export class JumpIdleState extends CharacterState {
  get name(): CharacterAnimationName { return 'Jump_Idle' }
}

export class JumpLandState extends CharacterState {
  get name(): CharacterAnimationName { return 'Jump_Land' }
}

export class NoState extends CharacterState {
  get name(): CharacterAnimationName { return 'No' }
}

export class PunchState extends CharacterState {
  get name(): CharacterAnimationName { return 'Punch' }
}

export class WaveState extends CharacterState {
  get name(): CharacterAnimationName { return 'Wave' }  
}

export class YesState extends CharacterState {
  get name(): CharacterAnimationName { return 'Yes' }
}
