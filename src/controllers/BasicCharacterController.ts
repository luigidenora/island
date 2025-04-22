import { Characters } from "../components/Characters";
import { CharacterAnimator } from "./CharacterAnimator";
import { CharacterInputHandler } from "./CharacterInputHandler";
import { CharacterPhysicsController } from "./CharacterPhysicsController";
import { CharacterStateMachine } from "./CharacterStateMachine";
import RAPIER from "@dimforge/rapier3d";
import { attachRapierToCharacter } from "./physics/attachRapierToCharacter";

/**
 * Main character controller that orchestrates all components.
 * This class is responsible for:
 * 1. Initializing all components
 * 2. Updating them in the correct order
 * 3. Providing a clean interface for the rest of the application
 */
export class BasicCharacterController {
  private input: CharacterInputHandler;
  private animator: CharacterAnimator;
  private physics: CharacterPhysicsController;
  private stateMachine: CharacterStateMachine;

  /**
   * Creates a new character controller.
   * @param character - The character to control
   * @param world - The Rapier physics world
   */
  constructor(private character: Characters, private world: RAPIER.World) {
    // Attach Rapier physics to the character
    attachRapierToCharacter(character, world);
    
    // Initialize all components
    this.input = new CharacterInputHandler();
    this.animator = new CharacterAnimator(character);
    this.physics = new CharacterPhysicsController(character);
    this.stateMachine = new CharacterStateMachine(this.animator);
    
    // Set initial state
    this.stateMachine.setState("Idle");
    
    // Log initialization
    console.log("BasicCharacterController initialized", {
      characterPosition: this.character.position,
      characterRotation: this.character.quaternion,
    });
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
    
    // Update input
    this.input.update();
    
    // Update state machine (handles animations)
    this.stateMachine.update(delta, this.input);
    
    // Update physics (handles movement)
    this.physics.update(delta, this.input);
    
    // Update animator (handles animation mixer)
    this.animator.update(delta);
    
    // Log debug info occasionally
    if (Math.random() < 0.01) {
      console.log("Character update", {
        characterPosition: this.character.position,
        characterRotation: this.character.quaternion,
      });
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
} 