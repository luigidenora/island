import { InstancedMesh2, InstancedMesh2Params } from "@three.ez/instanced-mesh";
import { InstancedMesh, Material, Matrix4 } from "three";
import { createSimplifiedGeometry } from "./meshSimplifier";

const _tempMat4 = new Matrix4();

export function parseToInstancedMesh2(
  mesh: InstancedMesh,
  params: InstancedMesh2Params = {}
): InstancedMesh2 {
  params.capacity ??= mesh.count;

  const instancedMesh = new InstancedMesh2(
    mesh.geometry,
    mesh.material,
    params
  );
  instancedMesh.castShadow = true;

  instancedMesh.name = (mesh.material as Material).name;

  if (instancedMesh.name.includes("Palm")) {
    instancedMesh.setManualDetectionMode();
    instancedMesh.bindProperty(
      "visible",
      () => instancedMesh.scene?.userData.isRenderTargetRendering
    );
  }

  instancedMesh.addInstances(mesh.count, () => {});

  instancedMesh.position.copy(mesh.position);
  instancedMesh.quaternion.copy(mesh.quaternion);
  instancedMesh.scale.copy(mesh.scale);
  instancedMesh.updateMatrix();

  for (let i = 0; i < mesh.count; i++) {
    mesh.getMatrixAt(i, _tempMat4);
    instancedMesh.setMatrixAt(i, _tempMat4);
  }

  instancedMesh.computeBVH();
  return instancedMesh;
}

export function initLOD(instancedMesh: InstancedMesh2) {
  const geometry = instancedMesh.geometry;
  const material = instancedMesh.material as Material;

  if (instancedMesh.name.includes("Palm")) {
    instancedMesh.setManualDetectionMode();
    instancedMesh.bindProperty(
      "visible",
      () => instancedMesh.scene?.userData.isRenderTargetRendering
    );
    createSimplifiedGeometry(geometry.clone(), {
      ratio: 0.25,
      error: 1,
      lockBorder: true,
    }).then((geo) => {
      instancedMesh.addLOD(geo, material.clone(), 15);
    });
  } else {
    createSimplifiedGeometry(geometry.clone(), {
      ratio: 0.1,
      error: 1,
      lockBorder: true,
    }).then((geo) => {
      instancedMesh.addLOD(geo, material.clone(), 15);
    });
  }
}
