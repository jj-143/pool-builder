import * as THREE from "three";

import App from "@core/App";

import Pool from "~/lib/Pool";
import uniforms from "~/uniforms";

const material = new THREE.MeshBasicMaterial({
  stencilRef: 1,
  stencilWrite: true,
  stencilFunc: THREE.AlwaysStencilFunc,
  stencilZPass: THREE.ReplaceStencilOp,
  colorWrite: false,
  depthWrite: false,
  side: THREE.DoubleSide, // WaterSimulation is from below
});

export default class StencilHelper {
  pool: Pool;
  private mesh?: THREE.Mesh;

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
    return new THREE.Mesh(geometry, material);
  }

  /**
   * @remarks: Recreate the stencil mesh for now.
   */
  updateStencil() {
    this.mesh?.removeFromParent();
    const points = uniforms["points"].value.slice(0, uniforms["nPoints"].value);
    this.mesh = this.create(points);
    App.instance.project!.scene.add(this.mesh);
    this.pool.sim.renderStencil(this.mesh);
  }
}
