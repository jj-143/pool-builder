import * as THREE from "three";

import Project from "@core/Project";

import Pool from "~/lib/Pool";

export default class PoolBuilder extends Project {
  pool: Pool;

  constructor() {
    super();
    this.pool = new Pool();
  }

  override start() {
    this.camera.position.set(0, 3, 2);
    this.camera.lookAt(0, 1, 0);
    this.pool.init();
    this.drawPlus();
  }

  override toggleOverlays() {
    super.toggleOverlays();
    this.pool.toggleMode();
  }

  private drawPlus() {
    this.pool.clear();

    const points = [
      [1, -0.5],
      [0.5, -0.5],
      [0.5, -1],
      [-0.5, -1],
      [-0.5, -0.5],
      [-1, -0.5],
      [-1, 0.5],
      [-0.5, 0.5],
      [-0.5, 1],
      [0.5, 1],
      [0.5, 0.5],
      [1, 0.5],
    ];

    points.forEach((point) => {
      this.pool.appendNode(new THREE.Vector3(point[0], 0, point[1]));
    });
  }
}
