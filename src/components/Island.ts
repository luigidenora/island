import { Asset } from '@three.ez/main';
import { Group, Mesh, Object3D } from 'three';
import { GLTF, GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DEBUG } from '../config/debug';

Asset.preload(GLTFLoader, 'assets/models/island.glb'); // Preload the island model when import this component

export class Island extends Group {
    /**
     * Disable the island from being intercepted by the raycaster (so many objects are children of the island)
     */
    public interceptByRaycaster: boolean = false;


    constructor() {
        super();
        const gltf = Asset.get<GLTF>('assets/models/island.glb');

        console.assert(!!gltf, 'Island model not found in assets');
        console.assert(gltf.scene.children[0] instanceof Object3D, 'Island model has no children');

        this.add(...gltf.scene.children);

       
        const folder = DEBUG.addFolder({ title: 'Island' });
        folder.addBinding(this, 'scale');
        folder.addBinding(this, 'rotation');
        folder.addBinding(this, 'position');
    }

    /** adds an element in place of the identified placeholder */
      public addToPlaceholder(obj:Object3D, placeholderName:string){
      const gltfWater = this.querySelector(`[name=${placeholderName}]`);
      if (gltfWater) {
        obj.position.copy(gltfWater.position);
        gltfWater.removeFromParent();
      }
      this.add(obj);
    }
} 
