import RAPIER from "@dimforge/rapier3d";
import { Vector3 } from "three";
import { GameCharacter } from "../components/Characters";
import { VirtualJoystick } from "../components/virtual-joystick/VirtualJoystick";
import { CharacterAnimator } from "./CharacterAnimator";
import { BasicCharacterInputHandler } from "./CharacterInput";
import { CharacterKeybordInputHandler } from "./CharacterInputKeybordHandler";
import { CharacterInputTouchHandler } from "./CharacterInputTouchHandler";
import { CharacterPhysicsController } from "./CharacterPhysicsController";
import {
  HumanoidCharacterStateMachine,
  SharkCharacterStateMachine,
} from "./CharacterStateMachine";
import { attachRapierToCharacter } from "./physics/attachRapierToCharacter";

/**
 * Main character controller that orchestrates all components.
 * This class is responsible for:
 * 1. Initializing all components
 * 2. Updating them in the correct order
 * 3. Providing a clean interface for the rest of the application
 */
export class BasicCharacterController {
  protected input: BasicCharacterInputHandler;
  protected animator: CharacterAnimator;
  public physics: CharacterPhysicsController;
  public stateMachine:
    | HumanoidCharacterStateMachine
    | SharkCharacterStateMachine;
  public initialPosition: Vector3;

  /**
   * Creates a new character controller.
   * @param character - The character to control
   * @param world - The Rapier physics world
   * @param stateMachineClass - the class to manage the state of character
   */
  constructor(
    protected character: GameCharacter,
    protected world: RAPIER.World,
    stateMachineClass = HumanoidCharacterStateMachine
  ) {
    // Attach Rapier physics to the character
    attachRapierToCharacter(character, world);

    this.initialPosition = character.position.clone();

    // Initialize all components
    if (this.character.isPlayer) {
      const touchJoystick = new VirtualJoystick();

      if (touchJoystick.isVisible) {
        this.input = new CharacterInputTouchHandler(touchJoystick);
      } else {
        this.input = new CharacterKeybordInputHandler();
      }
     let isDead = false;
      window.addEventListener("game-over", () => {
        if (isDead) return;
        isDead = true;
        this.stateMachine.setState("Death");
        setTimeout(() => {
          this.input = undefined; // force game over
        }, 500);

        window.removeEventListener("game-over", () => {});
      })
      window.addEventListener("damage", (event) => {  
          this.stateMachine.setState("HitReact");
          setTimeout(() => {
            this.stateMachine.setState("Idle");
          }, 1000);
      })

    }

    this.animator = new CharacterAnimator(character);
    this.physics = new CharacterPhysicsController(world, character);
    this.stateMachine = new stateMachineClass(this.animator);
  }

  /**
   * Updates the character controller.
   * This method should be called once per frame.
   * @param delta - The time elapsed since the last update in seconds
   */
  update(delta: number): void {
    if (!this.character) {
      return;
    }

    this.checkCharacterFall();

    // Update state machine (handles animations)
    this.stateMachine.update(delta, this.input);

    // Update physics (handles movement)
    this.physics.update(delta, this.input);

    // Update animator (handles animation mixer)
    this.animator.update(delta);
  }

  // Controlla se l'NPC è caduto in acqua
  protected checkCharacterFall() {
    if (this.character.position.y < -5) {
      this._respawnAtInitialPosition();
    }
  }

  /**
   * Gets the current position of the character.
   */
  get position() {
    return this.animator.position;
  }

  /**
   * Gets the current rotation of the character.
   */
  get rotation() {
    return this.animator.rotation;
  }


  get collider() {
    return this.physics.collider;
  }

  protected _respawnAtInitialPosition(): void {
    // Resetta la posizione dell'NPC al punto iniziale
    this.character.position.copy(this.initialPosition);

    // Reset the physics body position
    this.physics.body.setNextKinematicTranslation({
      x: this.initialPosition.x,
      y: 10,
      z: this.initialPosition.z,
    });
  }
}
