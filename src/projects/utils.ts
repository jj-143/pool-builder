import * as THREE from "three";

import uniforms from "~/uniforms";

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

export async function loadTexture(url: string): Promise<THREE.Texture> {
  return new Promise((resolve) => {
    new THREE.TextureLoader().load(url, (texture) => {
      resolve(texture);
    });
  });
}

export async function importTexture(
  url: string,
  key: keyof typeof uniforms,
): Promise<THREE.Texture> {
  const texture = await loadTexture(url);
  uniforms[key].value = texture;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}
