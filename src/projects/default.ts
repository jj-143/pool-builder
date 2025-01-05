import * as THREE from "three";

import Project from "../core/Project";

export default class DefaultProject extends Project {
  override start() {
    this.initCube();
    this.initWorld();
  }

  private initCube() {
    const geometry = new THREE.BoxGeometry(2, 2, 2);
    const material = new THREE.MeshPhysicalMaterial({ color: 0xe7e7e7 });
    const mesh = new THREE.Mesh(geometry, material);
    this.scene.add(mesh);
  }

  private initWorld() {
    this.scene.background = new THREE.Color(0x404040);

    const light = new THREE.PointLight();
    light.intensity = 50;
    light.position.set(3, 4, 2.5);
    this.attachControl(light);
    this.scene.add(light);
  }
}
