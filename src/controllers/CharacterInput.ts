/**
 * Type definition for character input
 */
export interface CharacterInput {
    forward: boolean;
    backward: boolean;
    left: boolean;
    right: boolean;
    jump: boolean;
    run: boolean;
    sword: boolean;
  }


export abstract class BasicCharacterInputHandler { 
    public keys: CharacterInput = {
        forward: false,
        backward: false,
        left: false,
        right: false,
        jump: false,
        run: false,
        sword: false,
    };
  }