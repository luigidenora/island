import { Asset } from "@three.ez/main";
import { AnimationClip, Euler, Group, Vector3 } from "three";
import { GLTF, GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { clone } from 'three/examples/jsm/utils/SkeletonUtils.js';

export type CharacterName = 'Anne' | 'Captain_Barbarossa' | 'Henry' | 'Mako' | 'Shark' | 'Sharky' | 'Skeleton_Headless' | 'Skeleton' | 'Tentacle';

Asset.preload(GLTFLoader, 'glTF/Characters_Anne.gltf','glTF/Characters_Captain_Barbarossa.gltf','glTF/Characters_Henry.gltf','glTF/Characters_Mako.gltf','glTF/Characters_Shark.gltf','glTF/Characters_Sharky.gltf','glTF/Characters_Skeleton_Headless.gltf','glTF/Characters_Skeleton.gltf','glTF/Characters_Tentacle.gltf');

export class Characters extends Group {
    /**
     * Array of animation clips for this character
     */
    public animations: AnimationClip[];

    /**
     * The name/type of this character
     */
    public name: CharacterName;

    /**
     * Creates a new character instance.
     * @param name - The name of the character model to load
     * @param position - The initial 3D position vector for this character
     * @param rotation - The initial Euler rotation angles for this character
     */
    constructor(name: CharacterName, {position, rotation}: {position: Vector3, rotation: Euler}) {
        super();
        this.name = name;
        
        // Load and clone the character model from assets
        const gltf = Asset.get<GLTF>(`glTF/Characters_${this.name}.gltf`);
        this.add(...clone(gltf.scene).children);
        
        // Store animations from the loaded model
        this.animations = gltf.animations;
        
        // Set initial transform
        this.position.copy(position);
        this.rotation.copy(rotation);
    }

}
