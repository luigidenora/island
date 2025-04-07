import { Asset } from "@three.ez/main";
import { Group, Vector3, AnimationMixer, AnimationClip, AnimationAction, Euler } from "three";
import { GLTF, GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { BasicCharatterController } from "../controls/BasicCharaterController";

export type CharacterName = 'Anne' | 'Captain_Barbarossa' | 'Henry' | 'Mako' | 'Shark' | 'Sharky' | 'Skeleton_Headless' | 'Skeleton' | 'Tentacle';

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

        this.position.copy(position);
        this.rotation.copy(rotation);
    }

}
