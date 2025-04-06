import { Asset } from '@three.ez/main';
import { Group, Object3D, Vector3 } from 'three';
import { GLTF, GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { Pane } from 'tweakpane';

Asset.preload(GLTFLoader, 'assets/models/island.glb'); // Preload the island model when import this component

export class Island extends Group {
    private playerSpawnPoint: Vector3 | null = null;
    private enemySpawnPoint: Vector3 | null = null;

    constructor() {
        super();
        const gltf = Asset.get<GLTF>('assets/models/island.glb');
        
        console.assert(!!gltf, 'Island model not found in assets');
        console.assert(gltf.scene.children[0] instanceof Object3D, 'Island model has no children');

        this.add(...gltf.scene.children);

        const pane = new Pane();
        const folder = pane.addFolder({ title: 'Island' });
        folder.addBinding(this, 'scale');
        folder.addBinding(this, 'rotation');
        folder.addBinding(this, 'position');
    }
} 