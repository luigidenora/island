# Character Controller System

This directory contains the refactored character controller system with Rapier physics integration.

## Structure

The character controller system is divided into several components:

- `BasicCharacterController.ts` - The main orchestrator that initializes and updates all components
- `CharacterInputHandler.ts` - Handles keyboard, mouse, and touch input
- `CharacterAnimator.ts` - Manages character animations
- `CharacterPhysicsController.ts` - Handles physics-based movement using Rapier
- `CharacterStateMachine.ts` - Manages character states and transitions
- `physics/attachRapierToCharacter.ts` - Utility function to attach Rapier physics to a character

## Usage

To use the character controller system:

1. Create a character:
   ```typescript
   const player = new Characters("Captain_Barbarossa", spawnPoint);
   scene.add(player);
   ```

2. Create a character controller:
   ```typescript
   const characterController = new BasicCharacterController(player, physicsWorld);
   ```

3. Update the character controller in your game loop:
   ```typescript
   characterController.update(deltaTime);
   ```

## Components

### BasicCharacterController

The main orchestrator that initializes and updates all components. It provides a clean interface for the rest of the application.

### CharacterInputHandler

Handles all input for the character controller, including keyboard, mouse, and touch input with joystick support.

### CharacterAnimator

Manages the animation mixer and provides methods to play animations. It also provides a proxy for the state machine.

### CharacterPhysicsController

Handles physics-based movement using Rapier. It applies forces to the character's rigid body based on input.

### CharacterStateMachine

Manages character states and transitions. It uses the animation proxy to play animations.

### attachRapierToCharacter

Utility function to attach Rapier physics to a character. It creates a rigid body and collider and stores them in the character's userData.

## Future Improvements

- Add `isGrounded` with raycast under the body (for better jump detection)
- Use `setNextKinematicTranslation()` for more precise controls
- Create events like `onLand`, `onJumpStart`, `onFallStart` in the states
- Implement the remaining states (Death, Duck, HitReact, etc.) 