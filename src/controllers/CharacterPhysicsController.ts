import { Quaternion, Vector3, Matrix4 } from "three";
import { Characters } from "../components/Characters";
import { CharacterInputHandler } from "./CharacterInputHandler";
import RAPIER from "@dimforge/rapier3d";
import { DEBUG } from "../config/debug";

/**
 * Handles physics-based movement for the character using Rapier.
 * Manages the rigid body and applies forces based on input.
 */
export class CharacterPhysicsController {
  private body: RAPIER.RigidBody;
  private isGrounded: boolean = true;
  private jumpForce: number = 5.0;
  private moveSpeed: number = 5.0;
  private runSpeed: number = 10.0;
  private rotationSpeed: number = 3.0;
  private offset: Vector3;

  constructor(private character: Characters) {
    // Get the Rapier body from the character's userData
    if (!character.userData.rapier?.body) {
      throw new Error("Character does not have a Rapier body attached. Call attachRapierToCharacter first.");
    }
    
    this.body = character.userData.rapier.body;
    this.offset = character.userData.rapier.offset || new Vector3(0, 0, 0);

    // Setup debug controls if debug mode is enabled
    if (DEBUG) {
      const folder = DEBUG.addFolder({ title: 'Character Physics' });
      
      // Add offset controls
      const offsetFolder = folder.addFolder({ title: 'Character Offset' });
      offsetFolder.addBinding(this.offset, 'x', { 
        label: 'X Offset', 
        min: -2, 
        max: 2, 
        step: 0.1 
      });
      offsetFolder.addBinding(this.offset, 'y', { 
        label: 'Y Offset', 
        min: -2, 
        max: 2, 
        step: 0.1 
      });
      offsetFolder.addBinding(this.offset, 'z', { 
        label: 'Z Offset', 
        min: -2, 
        max: 2, 
        step: 0.1 
      });

      // Add physics parameters controls
      const params = {
        jumpForce: this.jumpForce,
        moveSpeed: this.moveSpeed,
        runSpeed: this.runSpeed,
        rotationSpeed: this.rotationSpeed
      };

      folder.addBinding(params, 'jumpForce', { 
        label: 'Jump Force', 
        min: 0, 
        max: 20, 
        step: 0.5 
      }).on('change', (ev) => {
        this.jumpForce = ev.value;
      });

      folder.addBinding(params, 'moveSpeed', { 
        label: 'Move Speed', 
        min: 0, 
        max: 20, 
        step: 0.5 
      }).on('change', (ev) => {
        this.moveSpeed = ev.value;
      });

      folder.addBinding(params, 'runSpeed', { 
        label: 'Run Speed', 
        min: 0, 
        max: 30, 
        step: 0.5 
      }).on('change', (ev) => {
        this.runSpeed = ev.value;
      });

      folder.addBinding(params, 'rotationSpeed', { 
        label: 'Rotation Speed', 
        min: 0, 
        max: 10, 
        step: 0.1 
      }).on('change', (ev) => {
        this.rotationSpeed = ev.value;
      });
    }
  }

  /**
   * Updates the physics-based movement based on input.
   * This method should be called once per frame.
   * @param delta - The time elapsed since the last update in seconds
   * @param input - The input handler
   */
  update(delta: number, input: CharacterInputHandler): void {
    // Check if the character is grounded
    this._checkGrounded();
    
    // Handle jumping
    if (input.keys.space && this.isGrounded) {
      this._jump();
    }
    
    // Calculate movement direction
    const forward = new Vector3(0, 0, 1).applyQuaternion(this.character.quaternion);
    const right = new Vector3(1, 0, 0).applyQuaternion(this.character.quaternion);
    
    const moveDir = new Vector3();
    
    if (input.keys.forward) moveDir.add(forward);
    if (input.keys.backward) moveDir.sub(forward);
    if (input.keys.left) moveDir.sub(right);
    if (input.keys.right) moveDir.add(right);
    
    // Normalize the movement direction
    if (moveDir.lengthSq() > 0) {
      moveDir.normalize();
    }
    
    // Apply movement force
    const speed = input.keys.shift ? this.runSpeed : this.moveSpeed;
    moveDir.multiplyScalar(speed);
    
    // Get current velocity
    const currentVel = this.body.linvel();
    
    // Apply movement force while preserving vertical velocity (for gravity/jumping)
    this.body.setLinvel(
      { 
        x: moveDir.x, 
        y: currentVel.y, 
        z: moveDir.z 
      }, 
      true
    );
    
    // Handle rotation
    if (input.keys.left) {
      this._rotateCharacter(delta, 1);
    }
    if (input.keys.right) {
      this._rotateCharacter(delta, -1);
    }
    
    // Sync the visual representation with the physics body
    this._syncVisuals();
  }
  
  /**
   * Checks if the character is grounded by casting a ray downward.
   */
  private _checkGrounded(): void {
    // This is a simplified check. In a real implementation, you would use a raycast
    // to check if the character is touching the ground.
    const currentVel = this.body.linvel();
    this.isGrounded = Math.abs(currentVel.y) < 0.1;
  }
  
  /**
   * Applies a jump force to the character.
   */
  private _jump(): void {
    const currentVel = this.body.linvel();
    this.body.setLinvel(
      { 
        x: currentVel.x, 
        y: this.jumpForce, 
        z: currentVel.z 
      }, 
      true
    );
    this.isGrounded = false;
  }
  
  /**
   * Rotates the character based on input.
   * @param delta - The time elapsed since the last update in seconds
   * @param direction - The direction to rotate (1 for left, -1 for right)
   */
  private _rotateCharacter(delta: number, direction: number): void {
    const rotationAmount = this.rotationSpeed * delta * direction;
    const currentRotation = this.body.rotation();
    const newRotation = new Quaternion().setFromAxisAngle(
      new Vector3(0, 1, 0),
      rotationAmount
    ).multiply(new Quaternion(currentRotation.x, currentRotation.y, currentRotation.z, currentRotation.w));
    
    this.body.setRotation(newRotation, true);
  }
  
  /**
   * Syncs the visual representation with the physics body.
   */
  private _syncVisuals(): void {
    if (!this.character || !this.character.userData.rapier?.body) return;

    const body = this.character.userData.rapier.body;
    const offset = this.character.userData.rapier.offset || new Vector3(0, 0, 0);

    // Get the physics body's position and rotation
    const position = body.translation();
    const rotation = body.rotation();

    // Apply the offset to the physics position
    this.character.position.set(
      position.x + offset.x,
      position.y + offset.y,
      position.z + offset.z
    );

    // Convert the physics rotation to a quaternion
    const quaternion = new Quaternion();
    quaternion.setFromRotationMatrix(new Matrix4().makeRotationFromQuaternion(
      new Quaternion(rotation.x, rotation.y, rotation.z, rotation.w)
    ));
    this.character.quaternion.copy(quaternion);
  }
} 