import * as THREE from "three";

import Pool from "~/lib/Pool";

type PointXZ = [number, number];

export default class DrawHelper {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  drawPlus() {
    // 3 vertices starting from bottom-right vertex,
    // north, west, south, east order
    // prettier-ignore
    const points: PointXZ[] = [
      [0.5, -0.5], [0.5, -1], [-0.5, -1],  // north
      [-0.5, -0.5], [-1, -0.5], [-1, 0.5], // west
      [-0.5, 0.5], [-0.5, 1], [0.5, 1],    // south
      [0.5, 0.5], [1, 0.5], [1, -0.5],     // east
    ];

    this.draw(points);
  }

  drawRectangle(w = 2, h = 2) {
    w /= 2;
    h /= 2;

    // prettier-ignore
    this.draw([[w, -h], [-w, -h], [-w, h], [w, h]]); // CCW from NE
  }

  drawCircle(r = 1, count = 16) {
    const delta = (2 * Math.PI) / count;
    let theta = 0;

    const points: PointXZ[] = [...Array(count)].map(() => {
      theta += delta;
      return [r * Math.cos(-theta), r * Math.sin(-theta)];
    });

    this.draw(points);
  }

  private draw(points: PointXZ[]) {
    this.pool.clear();
    const points3D = points.map((xz) => new THREE.Vector3(xz[0], 0, xz[1]));
    points3D.forEach((vec) => this.pool.appendNode(vec));
  }
}
