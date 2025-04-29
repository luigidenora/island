import { Vector3, Quaternion } from "three";
import type RAPIER from "@dimforge/rapier3d";
import { GameCharacter } from "../components/Characters";
import { BasicCharacterInputHandler } from "./CharacterInput";

export class CharacterPhysicsController {
  public body: RAPIER.RigidBody;
  public collider: RAPIER.Collider;
  private characterController: RAPIER.KinematicCharacterController;
  private moveSpeed: number = 6.0;
  private runSpeed: number = 10.0;
  private rotationSpeed: number = 1.0;
  private readonly GRAVITY = -9.81;
  private direction: Vector3 = new Vector3(0, 0, 1);

  constructor(private world: RAPIER.World, private character: GameCharacter) {
    if (
      !character.userData.rapier?.body ||
      !character.userData.rapier?.collider
    ) {
      throw new Error("Character must have a Rapier body and collider.");
    }

    this.body = character.userData.rapier.body;
    this.collider = character.userData.rapier.collider;

    // Initialize character controller with proper settings
    this.characterController = this.world.createCharacterController(0.01);
    this.characterController.setApplyImpulsesToDynamicBodies(true);
    this.characterController.enableSnapToGround(0.5);
    this.characterController.enableAutostep(0.5, 0.2, true);
    this.characterController.setMaxSlopeClimbAngle((45 * Math.PI) / 180);
    this.characterController.setMinSlopeSlideAngle((30 * Math.PI) / 180);
  }

  update(delta: number, input: BasicCharacterInputHandler): void {
    // Update direction based on input
    this._updateDirection(delta, input);

    // Handle movement using the updated direction
    this._handleMovement(delta, input);

    // Sync visuals with physics
    this._syncVisuals();
  }

  private _updateDirection(delta: number, input: BasicCharacterInputHandler): void {
    // Calcola la rotazione in base all'input
    if (input.keys.right || input.keys.left) {
      // Ruota direttamente la direzione intorno all'asse Y
      const rotationAngle = (input.keys.right ? -1 : 1) * this.rotationSpeed * delta;
      this.direction.applyAxisAngle(new Vector3(0, 1, 0), rotationAngle);
      this.direction.normalize();
    }

    // Crea la rotazione dal vettore direzione
    const targetRotation = new Quaternion().setFromUnitVectors(
      new Vector3(0, 0, 1), // Direzione forward di default
      this.direction
    );

    // Applica la rotazione al rigid body
    this.body.setNextKinematicRotation({
      x: targetRotation.x,
      y: targetRotation.y,
      z: targetRotation.z,
      w: targetRotation.w,
    });
  }

  private _handleMovement(delta: number, input: BasicCharacterInputHandler): void {
    const desiredMove = new Vector3();

    // Usa la direzione corrente per il movimento
    if (input.keys.forward) desiredMove.add(this.direction);
    if (input.keys.backward) desiredMove.sub(this.direction);

    if (desiredMove.lengthSq() > 0) {
      desiredMove.normalize();
    }

    const speed = input.keys.run ? this.runSpeed : this.moveSpeed;
    desiredMove.multiplyScalar(speed * delta);

    // Apply gravity
    desiredMove.y += this.GRAVITY * delta;

    // Use Rapier's character controller for movement
    this.characterController.computeColliderMovement(this.collider, {
      x: desiredMove.x,
      y: desiredMove.y,
      z: desiredMove.z,
    });
  
    if (this.character.isPlayer) {
      // After the collider movement calculation is done, we can read the
      // collision events.
      for (let i = 0; i < this.characterController.numComputedCollisions(); i++) {
        let collision = this.characterController.computedCollision(i);
        // check if collision is chest
        if (collision?.collider?.isSensor()) {
          // Handle the collision with the chest
          window.dispatchEvent(
            new CustomEvent("chestCollision", {
              detail: {
                collider: collision.collider,
                character: this.character,
              },
            })
          );
        }
      }
    }



    const correctedMovement = this.characterController.computedMovement();

    // Apply the corrected movement to the character's position
    this.body.setNextKinematicTranslation({
      x: this.body.translation().x + correctedMovement.x,
      y: this.body.translation().y + correctedMovement.y,
      z: this.body.translation().z + correctedMovement.z,
    });

    // Check if the character is in the void and reset position if necessary
    if (this.body.translation().y < -5) {
      if (!this.character.canSwim) {
        this.body.setNextKinematicTranslation({
          x: this.character.initialPosition.x,
          y: this.character.initialPosition.y + 1,
          z: this.character.initialPosition.z,
        });
      } else {
        this.body.setNextKinematicTranslation({
          x: this.body.translation().x,
          y: 0.2 * Math.sin(delta),
          z: this.body.translation().z,
        });
      }
    }
  }

  private _syncVisuals(): void {
    const position = this.body.translation();
    const rotation = this.body.rotation();

    // Apply the offset towards the top to align the mesh above the capsule
    this.character.position.set(
      position.x,
      position.y - (this.character.userData.rapier?.offset?.y || 0),
      position.z
    );

    // Sync rotation
    this.character.quaternion.set(
      rotation.x,
      rotation.y,
      rotation.z,
      rotation.w
    );
  }
}
