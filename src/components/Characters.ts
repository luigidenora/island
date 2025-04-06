import { Asset } from "@three.ez/main";
import { Group, Vector3, AnimationMixer, AnimationClip, AnimationAction, Euler } from "three";
import { GLTF, GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

export type CharacterName = 'Anne' | 'Captain_Barbarossa' | 'Henry' | 'Mako' | 'Shark' | 'Sharky' | 'Skeleton_Headless' | 'Skeleton' | 'Tentacle';

export type AnimationName = 
    | 'Death' | 'Duck' | 'HitReact' | 'Idle' | 'Jump' | 'Jump_Idle' 
    | 'Jump_Land' | 'No' | 'Punch' | 'Run' | 'Sword' | 'Walk' 
    | 'Wave' | 'Yes';

Asset.preload(GLTFLoader, 'glTF/Characters_Anne.gltf');
Asset.preload(GLTFLoader, 'glTF/Characters_Captain_Barbarossa.gltf');
Asset.preload(GLTFLoader, 'glTF/Characters_Henry.gltf');
Asset.preload(GLTFLoader, 'glTF/Characters_Mako.gltf');
Asset.preload(GLTFLoader, 'glTF/Characters_Shark.gltf');
Asset.preload(GLTFLoader, 'glTF/Characters_Sharky.gltf');
Asset.preload(GLTFLoader, 'glTF/Characters_Skeleton_Headless.gltf');
Asset.preload(GLTFLoader, 'glTF/Characters_Skeleton.gltf');
Asset.preload(GLTFLoader, 'glTF/Characters_Tentacle.gltf');

/**
 * Characters class represents a 3D character model with animations.
 * It extends Three.js Group and provides methods to control character animations.
 */
export class Characters extends Group {
    public name: CharacterName;
    private mixer: AnimationMixer;
    private animationClips: AnimationClip[] = [];
    private currentAction: AnimationAction | null = null;
    private currentAnimation: AnimationName = 'Idle';
    
    /**
     * Creates a new character instance.
     * @param name - The name of the character model to load
     * @param position - The initial position of the character
     */
    constructor(name: CharacterName, {position, rotation}: {position: Vector3, rotation: Euler}) {
        super();
        this.name = name;
        // load model based on name
        const model = Asset.get<GLTF>(`glTF/Characters_${this.name}.gltf`);
        this.add(model.scene);
        
        // Setup animation mixer
        this.mixer = new AnimationMixer(model.scene);
        this.animationClips = model.animations;

        this.position.copy(position);
        this.rotation.copy(rotation);
        
        // Start with idle animation
        this.playAnimation('Idle');
    }
    
    /**
     * Updates the animation mixer with the given delta time.
     * This should be called in the animation loop.
     * @param delta - Time elapsed since the last frame in seconds
     */
    public animate(delta: number) {
        if (this.mixer) {
            this.mixer.update(delta);
        }
    }
    
    /**
     * Plays the specified animation with a smooth transition.
     * @param name - The name of the animation to play
     */
    public playAnimation(name: AnimationName) {
        if (this.currentAnimation === name) return;
        
        const clip = this.animationClips.find(clip => clip.name.includes(name));
        if (clip) {
            if (this.currentAction) {
                this.currentAction.fadeOut(0.2);
            }
            
            this.currentAction = this.mixer.clipAction(clip);
            this.currentAction.reset().fadeIn(0.2).play();
            this.currentAnimation = name;
        }
    }
    
    /**
     * Sets the forward movement state of the character.
     * @param value - Whether the character is moving forward
     */
    public setMoveForward(value: boolean) {
        if (value) {
            this.playAnimation('Walk');
        } else if (this.currentAnimation === 'Walk') {
            this.playAnimation('Idle');
        }
        this.position.z += 0.01;
    }
    
    /**
     * Sets the backward movement state of the character.
     * @param value - Whether the character is moving backward
     */
    public setMoveBackward(value: boolean) {
        if (value) {
            this.playAnimation('Walk');
        } else if (this.currentAnimation === 'Walk') {
            this.playAnimation('Idle');
        }
        this.position.z -= 0.01;
    }
    
    /**
     * Sets the left movement state of the character.
     * @param value - Whether the character is moving left
     */
    public setMoveLeft(value: boolean) {
        if (value) {
            this.playAnimation('Walk');
        } else if (this.currentAnimation === 'Walk') {
            this.playAnimation('Idle');
        }
        this.position.x -= 0.01;
    }
    
    /**
     * Sets the right movement state of the character.
     * @param value - Whether the character is moving right
     */
    public setMoveRight(value: boolean) {
        if (value) {
            this.playAnimation('Walk');
        } else if (this.currentAnimation === 'Walk') {
            this.playAnimation('Idle');
        }
        this.position.x += 0.01;
    }
    
    /**
     * Makes the character perform a jump sequence.
     * The sequence is: Jump → Jump_Idle → Jump_Land → Idle
     */
    public jump() {
        this.playAnimation('Jump');
        setTimeout(() => {
            this.playAnimation('Jump_Idle');
            setTimeout(() => {
                this.position.y += 0.1;
                this.playAnimation('Jump_Land');
                setTimeout(() => {
                    this.position.y -= 0.1;
                    this.playAnimation('Idle');
                }, 500);
            }, 500);
        }, 500);
      
    }
    
    /**
     * Generic method to play any animation by name.
     * @param animationName - The name of the animation to play
     */
    public play(animationName: AnimationName) {
        this.playAnimation(animationName);
    }
    
    /**
     * Plays a sequence of animations in order.
     * @param sequence - Array of animation names to play in sequence
     * @param duration - Duration in milliseconds for each animation (default: 500ms)
     */
    public playSequence(sequence: AnimationName[], duration: number = 500) {
        if (sequence.length === 0) return;
        
        let currentIndex = 0;
        const playNext = () => {
            if (currentIndex < sequence.length) {
                this.playAnimation(sequence[currentIndex]);
                currentIndex++;
                if (currentIndex < sequence.length) {
                    setTimeout(playNext, duration);
                }
            }
        };
        
        playNext();
    }
}
