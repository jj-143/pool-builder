import * as THREE from "three";

export function createSphere(
  pos: THREE.Vector3,
  size?: number,
  color?: string,
): THREE.Mesh {
  size = size ?? 0.01;
  color = color ?? "red";

  const point = new THREE.SphereGeometry(size, 8, 8);
  const mat = new THREE.MeshBasicMaterial({
    color: new THREE.Color(color),
  });
  const mesh = new THREE.Mesh(point, mat);
  mesh.position.copy(pos);
  return mesh;
}
