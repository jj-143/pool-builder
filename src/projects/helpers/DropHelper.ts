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

    const checkBound = (pos: THREE.Vector3) => {
      return -1 < pos.x && pos.x < 1 && -1 < pos.z && pos.z < 1;
    };

    const tryDrop = () => {
      raycaster.setFromCamera(pointer, camera);
      const ray = raycaster.ray;
      const pSurface = ray.direction
        .clone()
        .multiplyScalar((config.SURFACE_Y - ray.origin.y) / ray.direction.y)
        .add(ray.origin)
        .multiplyScalar(2 / config.POOL_SIZE); // To simulation space [-1, 1]
      if (!checkBound(pSurface)) return;
      this.pool.sim.addDrop(pSurface.x, pSurface.z, this.size, this.amount);
    };

    App.container.addEventListener("pointerdown", (event) => {
      if (event.button != 0) return;
      if (this.pool.mode != "normal") return;
      if (App.instance.uiControlState != "idle") return;
      App.instance.setUIControlState("interacting");
      const [w, h] = App.containerSize;
      dragging = true;
      pointer.x = (event.offsetX / w) * 2 - 1;
      pointer.y = -(event.offsetY / h) * 2 + 1;
      tryDrop();
    });

    App.container.addEventListener("pointermove", (event) => {
      if (!dragging) return;
      const [w, h] = App.containerSize;
      pointer.x = (event.offsetX / w) * 2 - 1;
      pointer.y = -(event.offsetY / h) * 2 + 1;
      tryDrop();
    });

    App.container.addEventListener("pointerup", () => (dragging = false));
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
