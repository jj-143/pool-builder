import * as THREE from "three";

import { uniforms } from "~/lib/shared";

import wallFrag from "~/shaders/wall.frag?raw";
import wallVert from "~/shaders/wall.vert?raw";

import type Node from "./Node";

const GEOMETRY = new THREE.PlaneGeometry(1, uniforms.poolDepth.value);

const MATERIAL = new THREE.ShaderMaterial({
  side: THREE.DoubleSide,
  vertexShader: wallVert,
  fragmentShader: wallFrag,
});

export default class Wall extends THREE.Mesh<
  THREE.BufferGeometry,
  THREE.ShaderMaterial
> {
  uniforms = {
    width: { value: 1 },
  };

  constructor(nodes: [Node, Node]) {
    const material = MATERIAL.clone();
    super(GEOMETRY, material);
    material.uniforms = { ...this.uniforms, ...uniforms };
    this.update(nodes);
  }

  update(nodes: [Node, Node]) {
    const [p0, p1] = nodes;
    const width = p0.point.distanceTo(p1.point);
    const angle = p1.point.clone().sub(p0.point).angle();
    const center = p0.point.clone().add(p1.point).divideScalar(2);

    this.scale.setX(width);
    this.position.set(center.x, -uniforms.poolDepth.value / 2, center.y);
    this.rotation.set(0, Math.PI - angle, 0);

    this.material.uniforms["width"].value = width;
  }
}
