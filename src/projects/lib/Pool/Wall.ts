import * as THREE from "three";

import uniforms from "~/uniforms";

import wallFrag from "~/shaders/wall.frag?raw";
import wallVert from "~/shaders/wall.vert?raw";

import type Node from "./Node";

const GEOMETRY = new THREE.PlaneGeometry(1, uniforms["poolDepth"].value);

const MATERIAL = new THREE.ShaderMaterial({
  side: THREE.DoubleSide,
  vertexShader: wallVert,
  fragmentShader: wallFrag,
});

export default class Wall extends THREE.Object3D {
  uniforms = {
    width: { value: 1 },
  };
  wallMesh: THREE.Mesh<THREE.BufferGeometry, THREE.ShaderMaterial>;

  constructor(nodes: [Node, Node]) {
    super();
    const material = MATERIAL.clone();
    material.uniforms = { ...this.uniforms, ...uniforms };
    this.wallMesh = new THREE.Mesh(GEOMETRY, material);
    this.add(this.wallMesh);
    this.update(nodes);
  }

  update(nodes: [Node, Node]) {
    const [p0, p1] = nodes;
    const width = p0.point.distanceTo(p1.point);
    const angle = p1.point.clone().sub(p0.point).angle();
    const center = p0.point.clone().add(p1.point).divideScalar(2);

    this.wallMesh.scale.setX(width);
    this.wallMesh.position.set(
      center.x,
      -uniforms["poolDepth"].value / 2,
      center.y,
    );
    this.wallMesh.rotation.set(0, Math.PI - angle, 0);
    this.wallMesh.material.uniforms["width"].value = width;
  }
}
