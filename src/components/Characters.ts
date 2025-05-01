import { Asset } from "@three.ez/main";
import { AnimationClip, Box3, Euler, Group, Vector3, Audio, AudioLoader, AudioListener } from "three";
import { GLTF, GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { clone } from "three/examples/jsm/utils/SkeletonUtils.js";

export type CharacterName =
  | "Anne"
  | "Captain_Barbarossa"
  | "Henry"
  | "Mako"
  | "Shark"
  | "Sharky"
  | "Skeleton_Headless"
  | "Skeleton"
  | "Tentacle";

Asset.preload(
  GLTFLoader,
  "glTF/Characters_Anne.gltf",
  "glTF/Characters_Captain_Barbarossa.gltf",
  "glTF/Characters_Henry.gltf",
  "glTF/Characters_Mako.gltf",
  "glTF/Characters_Shark.gltf",
  "glTF/Characters_Sharky.gltf",
  "glTF/Characters_Skeleton_Headless.gltf",
  "glTF/Characters_Skeleton.gltf",
  "glTF/Characters_Tentacle.gltf"
);

Asset.preload(AudioLoader, 'sandStep.mp3');

export const audioListener = new AudioListener();

export class GameCharacter extends Group {
  /**
   * The character position when the game starts
   */
  public initialPosition: Vector3;
  /**
   * Array of animation clips for this character
   */
  public animations: AnimationClip[];
  /**
   * The name/type of this character
   */
  public name: CharacterName;
  /**
   * The height of the character model, used for scaling and positioning
   */
  public height: number = 1; // Default height for characters
  /**
   * The radius of the character model, used for collision detection
   */
  public radius: number = 0.5; // Default radius for characters
  /**
   * the ability to swim
   * @default false
   */
  public canSwim: boolean = false; // Default swimming capability
  /**
   * The ability to jump
   * @default false
   */
  public isPlayer: boolean = false; // Default to non-player character
  /**
   * 
   */
  public walkSound: Audio;

  /**
   * Creates a new character instance.
   * @param name - The name of the character model to load
   * @param position - The initial 3D position vector for this character
   * @param rotation - The initial Euler rotation angles for this character
   */
  constructor(
    name: CharacterName,
    { position, rotation }: { position: Vector3; rotation: Euler },
    scale?: number
  ) {
    super();
    this.name = name;

    this.walkSound = new Audio(audioListener).setBuffer(Asset.get('sandStep.mp3'));
    this.walkSound.setVolume(0.1);

    // Load and clone the character model from assets
    const gltf = Asset.get<GLTF>(`glTF/Characters_${this.name}.gltf`);
    const model = clone(gltf.scene).children[0];
    this.add(model);

    if (scale) {
      this.scale.setScalar(scale);
    } else {
      // Calcola le dimensioni del modello usando una bounding box
      const bbox = new Box3().setFromObject(model);
      const size = new Vector3();
      bbox.getSize(size);
      this.scale.setScalar(size.y);
    }

    // Store animations from the loaded model
    this.animations = gltf.animations;

    // Set initial transform
    this.position.copy(position);
    this.rotation.copy(rotation);
    this.initialPosition = position.clone();

    this.bindProperty('visible', () => this.canSwim || this.scene?.userData.isRenderTargetRendering);

    const oldPosition = new Vector3();
    this.on('beforeanimate', () => {
      oldPosition.copy(this.position);
    });

    this.on('afteranimate', () => {
      if (Math.abs(this.position.x - oldPosition.x) > 0.01 || Math.abs(this.position.y - oldPosition.y) > 0.01 || Math.abs(this.position.z - oldPosition.z) > 0.01) {
        !this.walkSound.isPlaying && this.walkSound.play();
      }
    });
  }
}