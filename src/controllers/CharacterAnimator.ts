import { AnimationMixer, LoopOnce, Quaternion, Vector3 } from "three";
import { GameCharacter } from "../components/Characters";
import {
  CharacterAnimationName,
  CharacterAnimations,
  isValidAnimationName,
} from "../config/types";

/**
 * Proxy class that holds character animations for the state machine.
 * This class acts as a bridge between the character controller and the animation system.
 */
export class BasicCharacterControllerProxy {
  /**
   * Creates a new animation proxy.
   * @param animations - A record of animation names to their corresponding animation data
   */
  constructor(public animations: CharacterAnimations) {}
}

/**
 * Handles all animation-related functionality for the character.
 * Manages the animation mixer and provides methods to play animations.
 */
export class CharacterAnimator {
  private mixer: AnimationMixer;
  private animations: CharacterAnimations;
  private _position = new Vector3();
  private _rotation = new Quaternion();

  constructor(private character: GameCharacter) {
    // Initialize the animation mixer
    this.mixer = new AnimationMixer(this.character);

    // Create animation actions from the character's animation clips
    this.animations = this.character.animations.reduce((acc, animation) => {
      const name = animation.name as CharacterAnimationName;
      console.assert(
        isValidAnimationName(name),
        `Animation ${name} not found in character animations`
      );
      acc[name] = {
        clip: animation,
        action: this.mixer.clipAction(animation),
      };
      return acc;
    }, {} as CharacterAnimations);

    // Initialize position and rotation
    this._position.copy(this.character.position);
    this._rotation.copy(this.character.quaternion);
  }

  /**
   * Gets the current position of the character.
   */
  public get position(): Vector3 {
    // Update position from character
    this._position.copy(this.character.position);
    return this._position;
  }

  /**
   * Gets the current rotation of the character.
   */
  public get rotation(): Quaternion {
    if (!this.character) {
      return new Quaternion();
    }
    // Update rotation from character
    this._rotation.copy(this.character.quaternion);
    return this._rotation;
  }

  /**
   * Updates the animation mixer.
   * This method should be called once per frame.
   * @param delta - The time elapsed since the last update in seconds
   */
  update(delta: number): void {
    if (this.mixer) {
      this.mixer.update(delta);
    }
  }

  /**
   * Plays an animation with a crossfade from the current animation.
   * @param name - The name of the animation to play
   * @param crossFadeDuration - The duration of the crossfade in seconds
   */
  play(name: CharacterAnimationName, crossFadeDuration: number = 0.5): void {
    const action = this.animations[name].action;
    action.reset().fadeIn(crossFadeDuration).play();
  }

  /**
   * Plays an animation once and then returns to idle.
   * @param name - The name of the animation to play
   * @param crossFadeDuration - The duration of the crossfade in seconds
   */
  playOnce(name: CharacterAnimationName, crossFadeDuration: number = 0.5): void {
    const action = this.animations[name].action;
    action.reset()
      .setLoop(LoopOnce, 1)
      .clampWhenFinished = true;
    
    // Set up a callback to return to idle when the animation finishes
    const onFinished = () => {
      this.play("Idle", crossFadeDuration);
      action.getMixer().removeEventListener("finished", onFinished);
    };
    
    action.getMixer().addEventListener("finished", onFinished);
    action.fadeIn(crossFadeDuration).play();
  }

  /**
   * Gets the animation proxy for use with the state machine.
   */
  get proxy(): BasicCharacterControllerProxy {
    return new BasicCharacterControllerProxy(this.animations);
  }
} 