import { InstancedMesh2, InstancedMesh2Params } from '@three.ez/instanced-mesh';
import { InstancedMesh, Matrix4 } from 'three';

const _tempMat4 = new Matrix4();

export function parseToInstancedMesh2(mesh: InstancedMesh, params: InstancedMesh2Params = {}): InstancedMesh2 {
  params.capacity ??= mesh.count;

  const instancedMesh = new InstancedMesh2(mesh.geometry, mesh.material, params);
  instancedMesh.addInstances(mesh.count, () => {});

  instancedMesh.position.copy(mesh.position);
  instancedMesh.quaternion.copy(mesh.quaternion);
  instancedMesh.scale.copy(mesh.scale);
  instancedMesh.updateMatrix();

  for (let i = 0; i < mesh.count; i++) {
    mesh.getMatrixAt(i, _tempMat4);
    instancedMesh.setMatrixAt(i, _tempMat4);
  }

  // instancedMesh.computeBVH();
  return instancedMesh;
}