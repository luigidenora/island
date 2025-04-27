import { Vector3, Quaternion } from "three"; // Immagino tu stia usando Three.js
import type RAPIER from "@dimforge/rapier3d";
import { GameCharacter } from "../components/Characters";
import { BasicCharacterInputHandler } from "./CharacterInput";

export class CharacterPhysicsController {
  private body: RAPIER.RigidBody;
  private collider: RAPIER.Collider;
  private characterController: RAPIER.KinematicCharacterController;
  private moveSpeed: number = 10.0;
  private runSpeed: number = 20.0;
  private rotationSpeed: number = 5.0;
  private readonly GRAVITY = -9.81;

  constructor(private world: RAPIER.World, private character: GameCharacter) {
    if (
      !character.userData.rapier?.body ||
      !character.userData.rapier?.collider
    ) {
      throw new Error("Character must have a Rapier body and collider.");
    }

    this.body = character.userData.rapier.body;
    this.collider = character.userData.rapier.collider;

    this.characterController = this.world.createCharacterController(0.01);
    this.characterController.setApplyImpulsesToDynamicBodies(true);
    this.characterController.enableSnapToGround(0.5);
    this.characterController.enableAutostep(0.5, 0.2, true);
    this.characterController.setMaxSlopeClimbAngle(45 * Math.PI / 180);
    this.characterController.setMinSlopeSlideAngle(30 * Math.PI / 180);
  }

  update(delta: number, input: BasicCharacterInputHandler): void {
    const desiredMove = new Vector3();
    const forward = new Vector3(0, 0, 1).applyQuaternion(this.character.quaternion);
    const right = new Vector3(1, 0, 0).applyQuaternion(this.character.quaternion);

    if (input.keys.forward) desiredMove.add(forward);
    if (input.keys.backward) desiredMove.sub(forward);
    if (input.keys.left) desiredMove.sub(right);
    if (input.keys.right) desiredMove.add(right);

    if (desiredMove.lengthSq() > 0) {
      desiredMove.normalize();
    }

    const speed = input.keys.run ? this.runSpeed : this.moveSpeed;
    desiredMove.multiplyScalar(speed * delta);

    // Apply gravity
    desiredMove.y += this.GRAVITY * delta;

    // Use Rapier's character controller to compute movement
    this.characterController.computeColliderMovement(this.collider, {
      x: desiredMove.x,
      y: desiredMove.y,
      z: desiredMove.z,
    });

    const correctedMovement = this.characterController.computedMovement();

    // Apply the corrected movement to the character's position
    this.body.setNextKinematicTranslation({
      x: this.body.translation().x + correctedMovement.x,
      y: this.body.translation().y + correctedMovement.y,
      z: this.body.translation().z + correctedMovement.z,
    });

    // Handle rotation
    if (input.keys.right) {
      this._rotateCharacter(delta, -1);
    } else if (input.keys.left) {
      this._rotateCharacter(delta, 1);
    }

    // Check if the character is in the void and reset position if necessary
    if (this.body.translation().y < -5) {
      this.body.setNextKinematicTranslation({
        x: 0, // Default X position
        y: 10, // Default Y position above ground
        z: 0  // Default Z position
      });
    }

    // Sync visuals with physics
    this._syncVisuals();
  }

  private _rotateCharacter(delta: number, direction: number): void {
    const rotationAmount = this.rotationSpeed * delta * direction;
    const currentRotation = this.body.rotation();
    const newRotation = new Quaternion()
      .setFromAxisAngle(new Vector3(0, 1, 0), rotationAmount)
      .multiply(
        new Quaternion(
          currentRotation.x,
          currentRotation.y,
          currentRotation.z,
          currentRotation.w
        )
      );

    this.body.setNextKinematicRotation({
      x: newRotation.x,
      y: newRotation.y,
      z: newRotation.z,
      w: newRotation.w,
    });
  }

  private _syncVisuals(): void {
    const position = this.body.translation();
    const rotation = this.body.rotation();

    // Applica l'offset verso l'alto per allineare la mesh sopra la capsula
    this.character.position.set(
      position.x,
      position.y - (this.character.userData.rapier?.offset?.y || 0),
      position.z
    );

    const quaternion = new Quaternion(
      rotation.x,
      rotation.y,
      rotation.z,
      rotation.w
    );
    this.character.quaternion.copy(quaternion);
  }
}
