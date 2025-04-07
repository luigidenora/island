import { AnimationAction, AnimationClip, Camera, Scene } from "three";
import { Characters } from "../components/Characters";

/**
 * Parameters required for the character controller.
 * Includes the camera and the scene.
 */
export type ControllerParams = {
    camera?: Camera;
    scene: Scene;
            character: Characters;
        }

/**
 * A record mapping animation names to their corresponding animation data.
 * Contains all possible character animations like idle, walk, run, jump etc.
 * Used by the character controller to manage and play animations.
 */
export type CharacterAnimationName = 'Death' | 'Duck' | 'HitReact' | 'Idle' | 'Jump' | 'Jump_Idle' | 'Jump_Land' | 'No' | 'Punch' | 'Run' | 'Sword' | 'Walk' | 'Wave' | 'Yes';
/**
 * Checks if a string is a valid CharacterAnimationName
 * @param name - The string to check
 * @returns True if the string is a valid animation name
 */
export function isValidAnimationName(name: string): name is CharacterAnimationName {
    const validNames: CharacterAnimationName[] = [
      'Death', 'Duck', 'HitReact', 'Idle', 'Jump', 'Jump_Idle', 
      'Jump_Land', 'No', 'Punch', 'Run', 'Sword', 'Walk', 
      'Wave', 'Yes'
    ];
    return validNames.includes(name as CharacterAnimationName);
  }
/**
 * Represents an animation with its associated clip and action.
 * Used by the character controller to manage and play animations.
 */
export type CharacterAnimation = {
  clip: AnimationClip;
  action: AnimationAction;
}

/**
 * A record mapping animation names to their corresponding animation data.
 * Contains all possible character animations like idle, walk, run, jump etc.
 * Used by the character controller to manage and play animations.
 */
export type CharacterAnimations = Record<CharacterAnimationName, CharacterAnimation>;