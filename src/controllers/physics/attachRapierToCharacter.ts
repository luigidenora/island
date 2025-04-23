import { Characters } from "../../components/Characters";
import RAPIER from "@dimforge/rapier3d";
import { Vector3 } from "three";

/**
 * Attaches a Rapier physics body and collider to a character.
 * This function should be called once when initializing the player.
 * 
 * @param character - The character to attach physics to
 * @param world - The Rapier physics world
 * @returns The created body and collider
 */
export function attachRapierToCharacter(
  character: Characters,
  world: RAPIER.World
): { body: RAPIER.RigidBody; collider: RAPIER.Collider } {
  // Ensure the character's matrix is up to date
  character.updateMatrixWorld(true);
  // Create a dynamic rigid body for the character
  const bodyDesc = RAPIER.RigidBodyDesc.dynamic()
    .setTranslation(character.position.x, character.position.y, character.position.z)
    .setRotation(character.quaternion)
    .setLinearDamping(4.0)
    .setAngularDamping(1.0)
    .lockRotations(); // Lock rotations to prevent the character from falling over
  
  const body = world.createRigidBody(bodyDesc);
  
  // Create a capsule collider for the character
  // Adjust these values to match the character's dimensions
  const height = 1.0; // Increased height to better match character
  const radius = 0.4; // Slightly reduced radius
  
  // Create the capsule collider
  const colliderDesc = RAPIER.ColliderDesc.capsule(height / 2, radius)
    .setFriction(1.5)
    .setRestitution(0.0) // No bounce
    .setTranslation(0, height / 2, 0); // Offset the collider to align with character's center
  
  const collider = world.createCollider(colliderDesc, body);
  
  // Store the physics objects in the character's userData for later access
  character.userData.rapier = { body, collider };
  
  // Store the offset for later use in syncing
  character.userData.rapier.offset = new Vector3(0, -height / 2, 0);
  
  return { body, collider };
} 
