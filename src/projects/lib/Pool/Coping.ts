/**
 * Coping - the edge tiles surrounding the pool's top
 *
 * Given the Nodes [pa, pb, p1, p0, pc, pd] forming the Pool model with
 * model.nodes as below:
 *
 *  pc ----- p0 ------ p1 ----- pb
 *  |                            |
 *  |            Pool            |
 *  |                            |
 *  pd ------------------------ pa
 *
 *           p3 ------ p2
 *           |  Coping  |
 *  pc ----- p0 ------ p1 ----- pb
 *  |                            |
 *  |            Pool            |
 *  |                            |
 *  pd ------------------------ pa
 *
 * the mesh of coping for the edge [p1, p0] can be modeled with 4 vertices
 * [p0, p1, p2, p3], where p3 := p0 + DH * <coping size>, p2 := p1 + DH *
 * <coping size>, and {@link Coping.DH | DH} is a unit vector p0p3, orthogonal
 * to the edge pointing outside.
 *
 * This class only handles updating its base (p0, p1): {@link Coping.updateBase}
 * Updating the position & UV of its ends (p2, p3) is handled by Model, since
 * it involves adjacent copings: {@link Model.updateCopingEnds}
 */
import * as THREE from "three";

import config from "~/config";
import type Model from "~/lib/Pool/Model";
import { MATERIAL } from "~/lib/Pool/Wall";
import uniforms from "~/uniforms";

export default class Coping extends THREE.Mesh {
  baPosition: THREE.BufferAttribute;
  uniforms = {
    ...uniforms,
    width: { value: 1 },
    height: { value: config.COPING_SIZE },
    isCoping: { value: true },
  };

  constructor(p0: THREE.Vector2, p1: THREE.Vector2) {
    const material = MATERIAL.clone();
    super(makeGeometry(p0, p1), material);

    material.uniforms = this.uniforms;
    this.uniforms["width"].value = p0.distanceTo(p1);

    this.baPosition = this.geometry.getAttribute(
      "position",
    ) as THREE.BufferAttribute;
  }

  static DH(p0: THREE.Vector2, p1: THREE.Vector2) {
    return new THREE.Vector2(p0.y - p1.y, p1.x - p0.x).normalize();
  }

  updateBase(p0: THREE.Vector2, p1: THREE.Vector2) {
    this.baPosition.setXYZ(0, p0.x, 0, p0.y).setXYZ(1, p1.x, 0, p1.y);
    this.baPosition.needsUpdate = true;
    this.uniforms["width"].value = p0.distanceTo(p1);
  }
}

function makeGeometry(
  p0: THREE.Vector2,
  p1: THREE.Vector2,
): THREE.BufferGeometry {
  const points = [p0, p1, new THREE.Vector2(), new THREE.Vector2()];
  const positions = new Float32Array(points.flatMap((it) => [it.x, 0, it.y]));
  const normals = new Float32Array(points.flatMap(() => [0, 1, 0]));
  const uvs = new Float32Array([0, 0, 1, 0, 1, 1, 0, 1]);
  const indices = [0, 1, 2, 2, 3, 0];

  const baPosition = new THREE.BufferAttribute(positions, 3);
  const baNormal = new THREE.BufferAttribute(normals, 3);
  const baUV = new THREE.BufferAttribute(uvs, 2);

  return new THREE.BufferGeometry()
    .setIndex(indices)
    .setAttribute("position", baPosition)
    .setAttribute("normal", baNormal)
    .setAttribute("uv", baUV);
}
