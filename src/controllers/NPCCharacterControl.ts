import { GameCharacter } from "../components/Characters";
import RAPIER from "@dimforge/rapier3d";
import { CircleGeometry, LineBasicMaterial, BufferGeometry, Line, Vector3, Mesh, MeshBasicMaterial, Material } from "three";
import { HumanoidCharacterStateMachine } from "./CharacterStateMachine";
import { BasicCharacterController } from "./BasicCharacterController";
import { BasicCharacterInputHandler } from "./CharacterInput";
import { DEBUG } from "../config/debug";

/**
 * Configuration for NPC behavior
 */
interface NPCBehaviorConfig {
  /** Distance at which NPC can attack player */
  attackRange: number;
  /** Cooldown between attacks in seconds */
  attackCooldown: number;
  /** Distance at which NPC can detect player */
  detectionRange: number;
  /** Damage applied to player per attack */
  damagePerHit: number;
  /** Radius of the patrol area */
  patrolRadius: number;
  /** Speed of patrol movement */
  patrolSpeed: number;
}

/**
 * Default configuration for NPC behavior
 */
const DEFAULT_NPC_CONFIG: NPCBehaviorConfig = {
  attackRange: 2.0,
  attackCooldown: 2.0,
  detectionRange: 15.0,
  damagePerHit: 1,
  patrolRadius: 3.0,
  patrolSpeed: 0.5
};

/**
 * Game HUD interface for interaction with health system
 */
interface GameHUD {
  health: number;
}

/**
 * AI states for NPC behavior
 */
enum NPCState {
  /** NPC is idle, not taking any action */
  IDLE,
  /** NPC is patrolling around its starting point */
  PATROL,
  /** NPC has detected the player and is chasing them */
  CHASE,
  /** NPC is within attack range and attacking the player */
  ATTACK,
  /** NPC is cooling down after an attack before attacking again */
  COOLDOWN
}

/**
 * Custom event detail for player hit events
 */
interface PlayerHitEventDetail {
  damage: number;
  attacker: GameCharacter;
}

/**
 * AI-driven input handler for NPCs that implements chase and attack behavior
 */
class NPCInputHandler extends BasicCharacterInputHandler {
  /** Current AI state of the NPC */
  private state: NPCState = NPCState.IDLE;
  /** Timestamp of the last attack (in seconds) */
  private lastAttackTime: number = 0;
  /** Center point of patrol pattern */
  private patrolPoint: Vector3;
  /** Current angle in the patrol circuit */
  private patrolAngle: number = 0;
  /** Reference to the game HUD for health system */
  private gameHUD: GameHUD | null = null;
  /** Behavior configuration for this NPC */
  private config: NPCBehaviorConfig;
  /** Last time direction was changed (for rotation smoothing) */
  private lastDirectionChangeTime: number = 0;
  /** Minimum time between direction changes in seconds */
  private readonly DIRECTION_CHANGE_COOLDOWN: number = 0.2;
  /** Current patrol speed factor (for smooth acceleration/deceleration) */
  private patrolSpeedFactor: number = 0.5;
  /** Target point NPC is currently moving towards in patrol mode */
  private currentPatrolTarget: Vector3 = new Vector3();
  /** How close NPC needs to be to target to consider it reached (squared distance) */
  private readonly TARGET_REACHED_THRESHOLD: number = 0.3 * 0.3;

  constructor(
    private npc: GameCharacter,
    private player: GameCharacter,
    config?: Partial<NPCBehaviorConfig>
  ) {
    super();
    // Combine default config with any overrides
    this.config = { ...DEFAULT_NPC_CONFIG, ...config };
    // Store the initial position as patrol center
    this.patrolPoint = npc.position.clone();
    
    // Register this NPC for health system interaction
    this._registerWithGameSystem();
  }

  /**
   * Registers this NPC with the game system for health tracking
   */
  private _registerWithGameSystem(): void {
    try {
      // Notify the system about this NPC
      document.dispatchEvent(new CustomEvent('npc-register', {
        detail: { npc: this.npc }
      }));
      
      // Listen for GameHUD registration
      document.addEventListener('gamehud-ready', ((event: Event) => {
        const customEvent = event as CustomEvent<{gameHUD: GameHUD}>;
        if (customEvent.detail && customEvent.detail.gameHUD) {
          this.gameHUD = customEvent.detail.gameHUD;
        }
      }) as EventListener);
    } catch (e) {
      console.log('GameHUD registration failed, damage will not be applied');
    }
  }

  /**
   * Main update method called each frame
   * @param delta Time since last frame in seconds
   */
  update(delta: number) {
    // Reset all inputs
    this._resetInputs();
    
    // Determine the current state based on circumstances
    this._updateState();
    
    // Execute behavior based on current state
    this._executeBehavior(delta);
  }

  /**
   * Reset all input keys to false
   */
  private _resetInputs(): void {
    Object.keys(this.keys).forEach(key => {
      this.keys[key as keyof typeof this.keys] = false;
    });
  }

  /**
   * Update the NPC's state based on current conditions
   */
  private _updateState(): void {
    const distanceToPlayer = this.npc.position.distanceTo(this.player.position);
    const distanceToPatrolCenter = this.npc.position.distanceTo(this.patrolPoint);
    
    // State transitions based on distance to player
    if (distanceToPlayer <= this.config.attackRange) {
      // Attack if not in cooldown
      if (this.state !== NPCState.COOLDOWN) {
        this.state = NPCState.ATTACK;
      }
    } else if (distanceToPlayer <= this.config.detectionRange) {
      // Chase if player is detected but not in attack range
      this.state = NPCState.CHASE;
    } else if (this.state === NPCState.CHASE) {
      // Lost sight of player, go back to patrol
      this.state = NPCState.PATROL;
    } else if (this.state !== NPCState.PATROL) {
      // Default to patrol if no other condition is met
      this.state = NPCState.PATROL;
    }

    // Force return to patrol area if NPC has gone too far from patrol center
    if (distanceToPatrolCenter > this.config.patrolRadius * 2 && 
        this.state !== NPCState.CHASE && 
        distanceToPlayer > this.config.detectionRange) {
      this.state = NPCState.PATROL;
    }

    // Handle cooldown state transition
    if (this.state === NPCState.COOLDOWN) {
      const currentTime = performance.now() / 1000;
      if (currentTime - this.lastAttackTime >= this.config.attackCooldown) {
        this.state = NPCState.IDLE;
      }
    }
  }

  /**
   * Execute behavior for the current state
   * @param delta Time since last frame in seconds
   */
  private _executeBehavior(delta: number): void {
    switch (this.state) {
      case NPCState.IDLE:
        // Do nothing in idle state
        break;
        
      case NPCState.PATROL:
        this._handlePatrolBehavior(delta);
        break;
        
      case NPCState.CHASE:
        this._handleChaseBehavior();
        break;
        
      case NPCState.ATTACK:
        this._handleAttackBehavior();
        break;
        
      case NPCState.COOLDOWN:
        // No active behavior during cooldown
        break;
    }
  }

  /**
   * Handle patrol behavior - moving in a circular pattern
   * @param delta Time since last frame in seconds
   */
  private _handlePatrolBehavior(delta: number): void {
    // Advance angle for circular patrol with smoother movement
    // Use smaller increments for more precise movement
    this.patrolAngle += delta * this.config.patrolSpeed * 0.5;
    
    // Check if we are too far from patrol center
    const distanceToPatrolCenter = this.npc.position.distanceTo(this.patrolPoint);
    
    // Calculate next target position
    if (distanceToPatrolCenter > this.config.patrolRadius * 1.5) {
      // If too far from patrol area, move directly back to patrol center
      this.currentPatrolTarget.set(
        this.patrolPoint.x,
        this.npc.position.y,
        this.patrolPoint.z
      );
      // Increase speed to return to patrol area faster
      this.patrolSpeedFactor = Math.min(1.0, this.patrolSpeedFactor + delta * 0.5);
    } else {
      // Normal patrol behavior - calculate position on circle
      // Adjust target position to be slightly ahead on the circle for smoother movement
      const lookaheadAngle = this.patrolAngle + (delta * this.config.patrolSpeed * 2);
      this.currentPatrolTarget.set(
        this.patrolPoint.x + Math.cos(lookaheadAngle) * this.config.patrolRadius,
        this.npc.position.y,
        this.patrolPoint.z + Math.sin(lookaheadAngle) * this.config.patrolRadius
      );
      
      // Gradually adjust speed based on position
      const distanceToTarget = this.npc.position.distanceTo(this.currentPatrolTarget);
      
      if (distanceToTarget < 1.0) {
        // Slow down when approaching target
        this.patrolSpeedFactor = Math.max(0.3, this.patrolSpeedFactor - delta * 0.2);
      } else {
        // Speed up when far from target
        this.patrolSpeedFactor = Math.min(1.0, this.patrolSpeedFactor + delta * 0.3);
      }
    }
    
    // Calculate direction vector to target
    const direction = new Vector3(
      this.currentPatrolTarget.x - this.npc.position.x, 
      0, 
      this.currentPatrolTarget.z - this.npc.position.z
    );
    
    // Check if we've reached the current target (using squared distance for efficiency)
    const distanceSquared = direction.lengthSq();
    
    if (distanceSquared > this.TARGET_REACHED_THRESHOLD) {
      // Apply current speed factor
      this.keys.run = this.patrolSpeedFactor > 0.7;
      
      // Move toward target
      this._moveInDirection(direction);
    } else {
      // If we're at the target, slow down movement briefly
      this._resetInputs();
      this.patrolSpeedFactor = 0.3; // Reset speed factor to start slow
      
      // Advance angle more to avoid getting stuck
      this.patrolAngle += delta * this.config.patrolSpeed;
    }
  }

  /**
   * Handle chase behavior - pursue the player
   */
  private _handleChaseBehavior(): void {
    // Calculate direction to player
    const direction = new Vector3(
      this.player.position.x - this.npc.position.x,
      0,
      this.player.position.z - this.npc.position.z
    );
    
    // Move toward player
    this._moveInDirection(direction);
  }

  /**
   * Handle attack behavior - face player and attack
   */
  private _handleAttackBehavior(): void {
    const currentTime = performance.now() / 1000;
    
    // Calculate direction to player for facing
    const direction = new Vector3(
      this.player.position.x - this.npc.position.x,
      0,
      this.player.position.z - this.npc.position.z
    );
    
    // Face the player
    this._faceDirection(direction);
    
    // Execute attack if cooldown has passed
    if (currentTime - this.lastAttackTime >= this.config.attackCooldown) {
      this._executeAttack(currentTime);
    }
  }

  /**
   * Make NPC face in a specific direction
   * @param direction Direction vector to face
   */
  private _faceDirection(direction: Vector3): void {
    if (direction.length() > 0) {
      direction.normalize();
      
      // Check if enough time has passed since last direction change
      const currentTime = performance.now() / 1000;
      if (currentTime - this.lastDirectionChangeTime < this.DIRECTION_CHANGE_COOLDOWN) {
        return; // Skip direction change if we changed too recently
      }
      
      // Reset all directional keys first to prevent conflicting inputs
      this.keys.forward = false;
      this.keys.backward = false;
      this.keys.left = false;
      this.keys.right = false;
      
      // Only set one direction at a time based on the dominant axis
      if (Math.abs(direction.x) > Math.abs(direction.z)) {
        // X-axis movement is dominant
        if (direction.x > 0) this.keys.right = true;
        else this.keys.left = true;
      } else {
        // Z-axis movement is dominant
        if (direction.z > 0) this.keys.backward = true;
        else this.keys.forward = true;
      }
      
      // Record time of this direction change
      this.lastDirectionChangeTime = currentTime;
    }
  }

  /**
   * Execute an attack and apply damage
   * @param currentTime Current game time in seconds
   */
  private _executeAttack(currentTime: number): void {
    // Activate attack animation
    this.keys.sword = true;
    
    // Record attack time and transition to cooldown
    this.lastAttackTime = currentTime;
    this.state = NPCState.COOLDOWN;
    
    // Apply damage to player
    this._applyDamageToPlayer();
  }

  /**
   * Move NPC in specified direction
   * @param direction Direction vector to move in
   */
  private _moveInDirection(direction: Vector3): void {
    // Only apply movement if direction has significant magnitude
    if (direction.length() > 0.1) {
      // Determine which keys to press based on direction
      this._faceDirection(direction);
      
      // Enable running while chasing for faster pursuit
      this.keys.run = this.state === NPCState.CHASE;
    }
  }

  /**
   * Apply damage to the player through the HUD
   */
  private _applyDamageToPlayer(): void {
    // Only apply damage if we have a reference to the HUD
    if (this.gameHUD && typeof this.gameHUD.health === 'number') {
      const currentHealth = this.gameHUD.health;
      this.gameHUD.health = Math.max(0, currentHealth - this.config.damagePerHit);
      
      // Log for debugging
      if (DEBUG) {
        console.log(`NPC attack! Player health: ${this.gameHUD.health}`);
      }
      
      // Emit player-hit event for other systems
      this._emitPlayerHitEvent();
    }
  }

  /**
   * Emit event that player was hit
   */
  private _emitPlayerHitEvent(): void {
    const hitEvent = new CustomEvent<PlayerHitEventDetail>('player-hit', {
      detail: { 
        damage: this.config.damagePerHit, 
        attacker: this.npc 
      }
    });
    document.dispatchEvent(hitEvent);
  }
}

/**
 * NPC Character Controller that extends BasicCharacterController with AI behavior
 */
export class NPCCharacterControl extends BasicCharacterController {
  /** Debug visualization for attack range */
  private debugMesh?: Line;
  /** Debug visualization for path to player */
  private debugPath?: Line;
  /** Debug visualization for patrol path */
  private debugPatrolPath?: Line;
  /** Debug visualization for detection range */
  private debugDetectionRange?: Line;
  /** Input handler with NPC AI behavior */
  protected input: NPCInputHandler;

  /**
   * Create a new NPC Character Controller
   * @param character The character to control
   * @param world The physics world
   * @param player The player character to target
   * @param config Optional behavior configuration
   * @param stateMachineClass Animation state machine class
   */
  constructor(
    character: GameCharacter, 
    world: RAPIER.World, 
    player: GameCharacter,
    config?: Partial<NPCBehaviorConfig>,
    stateMachineClass = HumanoidCharacterStateMachine
  ) {
    super(character, world, stateMachineClass);
    
    // Create AI input handler
    this.input = new NPCInputHandler(character, player, config);

    // Create debug visualizations if in debug mode
    if (DEBUG) {
      this._createDebugVisuals(config);
    }
  }

  /**
   * Update the character controller
   * @param delta Time elapsed since last frame in seconds
   */
  override update(delta: number): void {
    // Don't check for falling for characters that can swim
    if(this.character.canSwim) {
      this.checkCharacterFall();
    }

    // Update AI behavior
    (this.input as NPCInputHandler).update(delta);
    
    // Update base controller (physics, animations)
    super.update(delta);

    // Update debug visualizations if in debug mode
    if (DEBUG) {
      this._updateDebugVisuals();
    }
  }

  /**
   * Create visual debugging aids
   */
  private _createDebugVisuals(config?: Partial<NPCBehaviorConfig>): void {
    const attackRange = config?.attackRange || DEFAULT_NPC_CONFIG.attackRange;
    const patrolRadius = config?.patrolRadius || DEFAULT_NPC_CONFIG.patrolRadius;
    const detectionRange = config?.detectionRange || DEFAULT_NPC_CONFIG.detectionRange;
    
    // Attack range indicator (red circle)
    this._createAttackRangeVisual(attackRange);
    
    // Line to player indicator (green line)
    this._createPathToPlayerVisual();
    
    // Patrol path indicator (blue circle)
    this._createPatrolPathVisual(patrolRadius);
    
    // Detection range indicator (yellow circle)
    this._createDetectionRangeVisual(detectionRange);
  }

  /**
   * Create attack range visual indicator
   */
  private _createAttackRangeVisual(radius: number): void {
    // Attack range should follow the character, so we create it centered at origin
    // and then position it with the character in _updateDebugVisuals
    this.debugMesh = this._createCircularVisual(radius, 0xff0000, new Vector3(0, 0, 0));
  }

  /**
   * Create patrol path visual indicator
   */
  private _createPatrolPathVisual(radius: number): void {
    // Patrol path should stay at the patrol center point
    // Use character's initial position as patrol center
    const patrolCenter = this.character.position.clone();
    this.debugPatrolPath = this._createCircularVisual(radius, 0x0000ff, patrolCenter);
  }

  /**
   * Create path to player visual indicator
   */
  private _createPathToPlayerVisual(): void {
    const pathGeometry = new BufferGeometry();
    const pathMaterial = new LineBasicMaterial({ color: 0x00ff00 });
    this.debugPath = new Line(pathGeometry, pathMaterial);
    this.character.parent?.add(this.debugPath);
  }

  /**
   * Create detection range visual indicator
   */
  private _createDetectionRangeVisual(radius: number): void {
    // Detection range should follow the character like the attack range
    this.debugDetectionRange = this._createCircularVisual(radius, 0xffff00, new Vector3(0, 0, 0));
  }

  /**
   * Create a circular visual indicator
   * @param radius The radius of the circle
   * @param color The color of the circle
   * @param center The center position of the circle
   * @returns Line object representing the circle
   */
  private _createCircularVisual(radius: number, color: number, center: Vector3): Line {
    const points = [];
    const segments = 32;
    
    // Create a circle of points
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      points.push(new Vector3(
        center.x + Math.cos(angle) * radius,
        center.y + 0.1, // Slightly above ground
        center.z + Math.sin(angle) * radius
      ));
    }
    
    const geometry = new BufferGeometry().setFromPoints(points);
    const material = new LineBasicMaterial({ color: color });
    const circle = new Line(geometry, material);
    this.character.parent?.add(circle);
    return circle;
  }

  /**
   * Update debug visualizations each frame
   */
  private _updateDebugVisuals(): void {
    // Update attack range position to follow the character
    if (this.debugMesh) {
      this.debugMesh.position.set(
        this.character.position.x,
        this.character.position.y + 0.1, // Slightly above ground
        this.character.position.z
      );
    }

    // Update detection range position to follow the character
    if (this.debugDetectionRange) {
      this.debugDetectionRange.position.set(
        this.character.position.x,
        this.character.position.y + 0.1, // Slightly above ground
        this.character.position.z
      );
    }

    // Keep patrol path at its original position, just update y to match terrain height
    if (this.debugPatrolPath) {
      // Only update the y coordinate to match terrain height
      this.debugPatrolPath.position.y = this.character.position.y + 0.1;
    }

    // Update path to player line
    if (this.debugPath && this.input instanceof NPCInputHandler) {
      const points = [
        this.character.position.clone(),
        (this.input as any).player.position.clone()
      ];
      points.forEach(p => p.y += 0.1);
      this.debugPath.geometry.setFromPoints(points);
    }
  }

  /**
   * Clean up resources when controller is disposed
   */
  dispose(): void {
    // Clean up debug mesh
    if (this.debugMesh) {
      this.debugMesh.geometry.dispose();
      if (this.debugMesh.material instanceof Material) {
        this.debugMesh.material.dispose();
      } else if (Array.isArray(this.debugMesh.material)) {
        this.debugMesh.material.forEach(mat => mat.dispose());
      }
      this.character.remove(this.debugMesh);
    }

    // Clean up path to player
    if (this.debugPath) {
      this.debugPath.geometry.dispose();
      (this.debugPath.material as LineBasicMaterial).dispose();
      this.debugPath.removeFromParent();
    }

    // Clean up patrol path
    if (this.debugPatrolPath) {
      this.debugPatrolPath.geometry.dispose();
      (this.debugPatrolPath.material as LineBasicMaterial).dispose();
      this.debugPatrolPath.removeFromParent();
    }
    
    // Clean up detection range
    if (this.debugDetectionRange) {
      this.debugDetectionRange.geometry.dispose();
      (this.debugDetectionRange.material as LineBasicMaterial).dispose();
      this.debugDetectionRange.removeFromParent();
    }
  }
}