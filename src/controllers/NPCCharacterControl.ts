import { GameCharacter } from "../components/Characters";
import RAPIER from "@dimforge/rapier3d";
import { CircleGeometry, LineBasicMaterial, BufferGeometry, Line, Vector3, Mesh, MeshBasicMaterial, Quaternion, Material } from "three";
import { HumanoidCharacterStateMachine } from "./CharacterStateMachine";
import { BasicCharacterController } from "./BasicCharacterController";
import { BasicCharacterInputHandler } from "./CharacterInput";
import { DEBUG } from "../config/debug";

/**
 * AI-driven input handler for NPCs that implements chase and attack behavior
 */
class NPCInputHandler extends BasicCharacterInputHandler {
  private lastAttackTime: number = 0;
  private readonly MOVEMENT_THRESHOLD = Math.PI / 3; // Increased from PI/4 to PI/3 for wider movement window
  private readonly ROTATION_THRESHOLD = 0.1;

  constructor(
    private npc: GameCharacter,
    private player: GameCharacter,
    private attackRange: number = 2.0,
    private attackCooldown: number = 2.0,
    private detectionRange: number = 15.0
  ) {
    super();
  }

  update(_delta: number) {
    // Reset all inputs
    Object.keys(this.keys).forEach(key => {
      this.keys[key as keyof typeof this.keys] = false;
    });

    // Calculate distance to player using world positions
    const npcWorldPosition = this.npc.getWorldPosition(new Vector3());
    const playerWorldPosition = this.player.getWorldPosition(new Vector3());
    const distanceToPlayer = npcWorldPosition.distanceTo(playerWorldPosition);

    // If player is within detection range
    if (distanceToPlayer <= this.detectionRange) {
      // Calculate direction to player in world space
      const directionToPlayer = playerWorldPosition.clone().sub(npcWorldPosition).normalize();

      // Get NPC's current forward direction
      const npcForward = new Vector3(0, 0, 1).applyQuaternion(this.npc.quaternion);

      // Calculate angle between current direction and target direction
      const crossProduct = new Vector3().crossVectors(npcForward, directionToPlayer);
      const dotProduct = npcForward.dot(directionToPlayer);
      const angleDiff = Math.atan2(crossProduct.y, dotProduct);

      if (DEBUG) {
        console.log(`[${this.npc.name}] Distance: ${distanceToPlayer.toFixed(2)}, AngleDiff: ${angleDiff.toFixed(2)}`);
      }
      if (distanceToPlayer >= this.attackRange/2) {
        // // Smooth rotation with deadzone to prevent oscillation
        const ROTATION_DEADZONE = 0.6;
        if (Math.abs(angleDiff) > ROTATION_DEADZONE) {
          if (angleDiff > 0) {
            this.keys.left = true;
            this.keys.right = false;
          } else {
            this.keys.right = true;
            this.keys.left = false;
          }
        }
      }

      // Move forward only when roughly facing the target
      const FORWARD_ANGLE_THRESHOLD = Math.PI / 4; // 45 degrees
      if (Math.abs(angleDiff) < FORWARD_ANGLE_THRESHOLD) {
        this.keys.forward = true;
      }

      // Attack logic
      if (distanceToPlayer <= this.attackRange) {
        const currentTime = performance.now() / 1000;
        if (currentTime - this.lastAttackTime >= this.attackCooldown) {
          this.keys.sword = true;
          this.lastAttackTime = currentTime;
          if (DEBUG) console.log(`[${this.npc.name}] Attacking!`);
          window.dispatchEvent(new CustomEvent("damage", { detail: { attacker: this.npc.name, target: this.player } }));
        }
      }
    }
  }
}

/**
 * NPC Character Controller that extends BasicCharacterController with AI behavior
 */
export class NPCCharacterControl extends BasicCharacterController {
  private debugMesh?: Mesh;
  private debugPath?: Line;
  private debugPatrolPath?: Line;
  protected input: NPCInputHandler;

  constructor(
    character: GameCharacter,
    world: RAPIER.World,
    player: GameCharacter,
   private options: {
      attackRange?: number;
      attackCooldown?: number;
      detectionRange?: number;
    } = {},
    stateMachineClass = HumanoidCharacterStateMachine
  ) {
    super(character, world, stateMachineClass);

    const { attackRange = 2.0, attackCooldown = 2.0, detectionRange = 15.0 } = options;

    this.input = new NPCInputHandler(character, player, attackRange, attackCooldown, detectionRange);

    if (DEBUG) {
      this._createDebugVisuals();
    }
  }

  override update(delta: number): void {
    if (this.character.name !== "Shark") {
      this.checkCharacterFall();
    }

    (this.input as NPCInputHandler).update(delta);
    super.update(delta);

    if (DEBUG) {
      this._updateDebugVisuals();
    }
  }

  private _createDebugVisuals(): void {
    // Attack range circle
    const geometry = new CircleGeometry(this.options.attackRange, 32);
    const material = new MeshBasicMaterial({ color: 0xff0000, wireframe: true });
    this.debugMesh = new Mesh(geometry, material);
    this.debugMesh.rotation.x = -Math.PI / 2;
    this.character.add(this.debugMesh);

    // Path line to player
    const pathGeometry = new BufferGeometry();
    const pathMaterial = new LineBasicMaterial({ color: 0x00ff00 });
    this.debugPath = new Line(pathGeometry, pathMaterial);
    this.character.parent?.add(this.debugPath);

    // Patrol path circle - fixed position
    const patrolPoints = [];
    const patrolRadius = 3.0;
    const segments = 32;
    const startPosition = this.character.position.clone();

    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      patrolPoints.push(new Vector3(
        startPosition.x + Math.cos(angle) * patrolRadius,
        startPosition.y + 0.1, // Leggermente sopra il terreno
        startPosition.z + Math.sin(angle) * patrolRadius
      ));
    }
    const patrolGeometry = new BufferGeometry().setFromPoints(patrolPoints);
    const patrolMaterial = new LineBasicMaterial({ color: 0x0000ff });
    this.debugPatrolPath = new Line(patrolGeometry, patrolMaterial);
    this.character.parent?.add(this.debugPatrolPath); // Aggiungiamo alla scena invece che al character
  }

  private _updateDebugVisuals(): void {
    if (this.debugMesh) {
      this.debugMesh.position.y = 0.1;
    }

    if (this.debugPath && this.input instanceof NPCInputHandler) {
      const points = [
        this.character.position.clone(),
        (this.input as any).player.position.clone()
      ];
      points.forEach(p => p.y += 0.1);
      this.debugPath.geometry.setFromPoints(points);
    }
  }

  dispose(): void {
    if (this.debugMesh) {
      this.debugMesh.geometry.dispose();
      if (this.debugMesh.material instanceof Material) {
        this.debugMesh.material.dispose();
      } else if (Array.isArray(this.debugMesh.material)) {
        this.debugMesh.material.forEach(m => m.dispose());
      }
      this.character.remove(this.debugMesh);
    }

    if (this.debugPath) {
      this.debugPath.geometry.dispose();
      (this.debugPath.material as LineBasicMaterial).dispose();
      this.debugPath.removeFromParent();
    }

    if (this.debugPatrolPath) {
      this.debugPatrolPath.geometry.dispose();
      (this.debugPatrolPath.material as LineBasicMaterial).dispose();
      this.debugPatrolPath.removeFromParent();
    }
  }
}