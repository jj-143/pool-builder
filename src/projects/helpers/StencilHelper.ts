import * as THREE from "three";

import Pool from "~/lib/Pool";

export default class StencilHelper {
  pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  /**
   * Create Stencil mesh from points.
   */
  create(points: THREE.Vector2[]): THREE.Mesh {
    const shape = new THREE.Shape();

    const start = points[0] ?? new THREE.Vector2();
    shape.moveTo(start.x, start.y);
    points.slice(1).forEach(({ x, y }) => {
      shape.lineTo(x, y);
    });
    shape.lineTo(start.x, start.y);

    const geometry = new THREE.ShapeGeometry(shape, 2);
    geometry.rotateX(Math.PI / 2);

    const material = new THREE.MeshBasicMaterial({
      stencilRef: 1,
      stencilWrite: true,
      stencilFunc: THREE.AlwaysStencilFunc,
      stencilZPass: THREE.ReplaceStencilOp,
      colorWrite: false,
      depthWrite: false,
      side: THREE.DoubleSide, // WaterSimulation is from below
    });

    return new THREE.Mesh(geometry, material);
  }
}
