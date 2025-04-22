import * as THREE from "three";
import { seededRandom } from "three/src/math/MathUtils";

import App from "@core/App";

import config from "~/config";
import Pool from "~/lib/Pool";

export default class DropHelper {
  size = 0.018;
  amount = 0.006;
  DEVSeed = 0;
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  attachDragWater() {
    let dragging = false;
    const pointer = new THREE.Vector2();
    const raycaster = new THREE.Raycaster();
    const camera = App.instance.project!.camera;

    const findSurfaceIntersection = (event: MouseEvent) => {
      const [w, h] = App.containerSize;
      pointer.x = (event.offsetX / w) * 2 - 1;
      pointer.y = -(event.offsetY / h) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      return this.pool.stencilHelper.intersect(raycaster);
    };

    App.container.addEventListener("pointerdown", (event) => {
      if (event.button != 0) return;
      if (this.pool.mode != "normal") return;
      if (App.instance.uiControlState != "idle") return;

      const intr = findSurfaceIntersection(event);
      if (!intr) return;

      dragging = true;
      App.instance.setUIControlState("interacting");
      this.drop(intr.point);
    });

    App.container.addEventListener("pointermove", (event) => {
      if (!dragging) return;
      const intr = findSurfaceIntersection(event);
      if (!intr) return;
      this.drop(intr.point);
    });

    App.container.addEventListener("pointerup", () => (dragging = false));
  }

  drop(point: THREE.Vector3) {
    this.pool.sim.addDrop(point.x, point.z, this.size, this.amount);
  }

  /**
   * Drop randomly [x,y] from each dim in [-POOL_SIZE/2, POOL_SIZE],
   * deterministically
   */
  DEVRandomDrop() {
    const u = seededRandom(this.DEVSeed++) * 2 - 1;
    const v = seededRandom(this.DEVSeed++) * 2 - 1;
    const point = new THREE.Vector2(u, v).multiplyScalar(config.POOL_SIZE);
    this.pool.sim.addDrop(point.x, point.y, this.size, this.amount);
  }
}
