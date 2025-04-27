import { GameCharacter } from "../components/Characters";
import { CharacterAnimator } from "./CharacterAnimator";
import { CharacterPhysicsController } from "./CharacterPhysicsController";
import RAPIER from "@dimforge/rapier3d";
import { attachRapierToCharacter } from "./physics/attachRapierToCharacter";
import { Vector3 } from "three";

export class NPCCharacterControl {
  private animator: CharacterAnimator;
  private physics: CharacterPhysicsController;
  private player: GameCharacter;
  private attackRange: number = 5.0; // Default attack range
  private attackCooldown: number = 2.0; // Cooldown in seconds
  private lastAttackTime: number = 0;
  private patrolDirection: number = 1; // 1 for forward, -1 for backward
  private patrolTimer: number = 0;
  private patrolDuration: number = 5.0; // Time in seconds to patrol in one direction

  constructor(private npc: GameCharacter, private world: RAPIER.World, player: GameCharacter) {
    // Attach Rapier physics to the NPC
    attachRapierToCharacter(npc, world);

    // Initialize components
    this.animator = new CharacterAnimator(npc);
    this.physics = new CharacterPhysicsController(world, npc);
    this.player = player;
  }

  update(delta: number): void {
    if (!this.npc || !this.player) {
      return;
    }

    // Calculate distance to the player
    const distanceToPlayer = this.npc.position.distanceTo(this.player.position);

    if (distanceToPlayer <= this.attackRange) {
      this._attackPlayer(delta);
    } else if (distanceToPlayer > this.attackRange) {
      this._patrol(delta);
    }

    // Update animator
    this.animator.update(delta);
  }

  private _patrol(delta: number): void {
    this.patrolTimer += delta;

    if (this.patrolTimer >= this.patrolDuration) {
      this.patrolDirection *= -1; // Reverse direction
      this.patrolTimer = 0; // Reset timer
    }

    const patrolVector = new Vector3(0, 0, this.patrolDirection * delta * 2.0); // Patrol speed
    this.npc.position.add(patrolVector);

    this.physics.update(delta, {
      keys: {
        forward: this.patrolDirection === 1,
        backward: this.patrolDirection === -1,
        left: false,
        right: false,
        jump: false,
        run: false,
        sword: false,
      },
    });
  }

  private _runTowardsPlayer(delta: number): void {
    const direction = new Vector3().subVectors(this.player.position, this.npc.position).normalize();
    const moveVector = direction.multiplyScalar(delta * 4.0); // NPC running speed

    this.physics.update(delta, {
      keys: {
        forward: true,
        backward: false,
        left: false,
        right: false,
        jump: false,
        run: true, // Enable running
        sword: false,
      },
    });

    this.npc.position.add(moveVector);
  }

  private _attackPlayer(delta: number): void {
    const currentTime = performance.now() / 1000; // Convert to seconds

    if (currentTime - this.lastAttackTime >= this.attackCooldown) {
      console.log("NPC attacks the player!");
      this.animator.playOnce("Sword");
      this.lastAttackTime = currentTime;
    } else {
      this._runTowardsPlayer(delta); // Run towards the player while waiting for cooldown
    }
  }
}