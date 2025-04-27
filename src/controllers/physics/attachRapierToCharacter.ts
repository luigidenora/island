import { GameCharacter } from "../../components/Characters";
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
  character: GameCharacter,
  world: RAPIER.World
): { body: RAPIER.RigidBody; collider: RAPIER.Collider } {
  // Ensure the character's matrix is up to date
  character.updateMatrixWorld(true);

  const bodyDesc = RAPIER.RigidBodyDesc.kinematicPositionBased()
  .setTranslation(character.position.x, character.position.y, character.position.z)
    .setRotation(character.quaternion)
    .lockRotations();

  const body = world.createRigidBody(bodyDesc);

  const height = character.height || 1; // Default height if not set
  const radius =character.radius || 0.5; // Default radius if not set

  const colliderDesc = RAPIER.ColliderDesc.capsule(height/2, radius)
    .setFriction(1)

    .setRestitution(0.0); 
  const collider = world.createCollider(colliderDesc, body);


  character.userData.rapier = { body, collider };


  character.userData.rapier.offset = new Vector3(0, height, 0);

  return { body, collider };
}

