import { Asset } from "@three.ez/main";
import { Group, InstancedMesh, Object3D } from "three";
import { GLTF, GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { DEBUG } from "../config/debug";
import { parseToInstancedMesh2 } from "./InstancedMesh2Helper";

Asset.preload(GLTFLoader, "assets/models/island.glb"); // Preload the island model when import this component

export class Island extends Group {
  /**
   * Disable the island from being intercepted by the raycaster (so many objects are children of the island)
   */
  public interceptByRaycaster = false;
  
  constructor() {
    super();
    const gltf = Asset.get<GLTF>("assets/models/island.glb");

    this.convertInstancedMeshes2(gltf);

    console.assert(!!gltf, "Island model not found in assets");
    console.assert(
      gltf.scene.children[0] instanceof Object3D,
      "Island model has no children"
    );

    this.add(...gltf.scene.children);
    
    const folder = DEBUG?.addFolder({ title: "Island",expanded: false});
    folder?.addBinding(this, "scale");
    folder?.addBinding(this, "rotation");
    folder?.addBinding(this, "position");

  }

  /** convert all instanced meshes to instancedMesh2 */
  private convertInstancedMeshes2(gltf: GLTF) {
    for (const instancedMesh of gltf.scene.querySelectorAll("[isInstancedMesh=true]")) {
      const parent = instancedMesh.parent;
      const instancedMesh2 = parseToInstancedMesh2(instancedMesh as InstancedMesh, { createEntities:true});
      instancedMesh.removeFromParent();
      parent?.add(instancedMesh2);
    }
  }

  /** adds an element in place of the identified placeholder */
  public addToPlaceholder(obj: Object3D, placeholderName: string) {
    const gltfObj = this.querySelector(`[name=${placeholderName}]`);
    if (gltfObj) {
      obj.position.copy(gltfObj.position);
      obj.quaternion.copy(gltfObj.quaternion);
      gltfObj.removeFromParent();
    }
    this.add(obj);
  }
}
