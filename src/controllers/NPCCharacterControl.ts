import { GameCharacter } from "../components/Characters";
import RAPIER from "@dimforge/rapier3d";
import { CircleGeometry, LineBasicMaterial, BufferGeometry, Line, Vector3, Mesh, MeshBasicMaterial } from "three";
import { HumanoidCharacterStateMachine } from "./CharacterStateMachine";
import { BasicCharacterController } from "./BasicCharacterController";
import { BasicCharacterInputHandler } from "./CharacterInput";
import { DEBUG } from "../config/debug";

/**
 * AI-driven input handler for NPCs that implements chase and attack behavior
 */
class NPCInputHandler extends BasicCharacterInputHandler {
  constructor(
    private npc: GameCharacter,
    private player: GameCharacter,
    private attackRange: number = 1.0,
    private attackCooldown: number = 2.0
  ) {
    super();
  }

  update(delta: number) {
    // Reset all inputs
    Object.keys(this.keys).forEach(key => {
      this.keys[key as keyof typeof this.keys] = false;
    });
    // Non facciamo nulla - l'NPC resta fermo
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
    private attackRange: number = 10.0,
    private attackCooldown: number = 2.0,
    stateMachineClass = HumanoidCharacterStateMachine
  ) {
    super(character, world, stateMachineClass);
    
    this.input = new NPCInputHandler(character, player, attackRange, attackCooldown);

    if (DEBUG) {
      this._createDebugVisuals();
    }
  }

  override update(delta: number): void {
    if(this.character.name !== "Shark") {
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
    const geometry = new CircleGeometry(this.attackRange, 32);
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
      this.debugMesh.material.dispose();
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