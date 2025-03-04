import * as THREE from "three";

import App from "@core/App";

import config from "~/config";
import Pool from "~/lib/Pool";

export default class DropHelper {
  size = 0.015;
  amount = 0.003;
  private pool: Pool;
  private DEVDropCount = 0;

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
      this.pool.sim.addDrop(pSurface.x, pSurface.z, this.size, -this.amount);
    };

    document.addEventListener("pointerdown", (event) => {
      if (event.button != 0) return;
      if (this.pool.mode != "normal") return;
      if (App.instance.uiControlState != "idle") return;
      App.instance.setUIControlState("interacting");

      dragging = true;
      pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
      pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
      tryDrop();
    });

    document.addEventListener("pointermove", (event) => {
      if (!dragging) return;
      pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
      pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
      tryDrop();
    });

    document.addEventListener("pointerup", () => (dragging = false));
  }

  /**
   * Drop at random / fixed position at fixed rate.
   */
  DEVRandomDrop() {
    if (this.pool.sim.step % 30 != 0) return;
    const points = [[0.1, 0.4]];
    const pos = points[this.DEVDropCount % points.length];
    this.pool.sim.addDrop(
      pos[0] * (2 / config.POOL_SIZE),
      pos[1] * (2 / config.POOL_SIZE),
      this.size,
      (this.DEVDropCount & 1 ? 1 : -1) * this.amount,
    );
    this.DEVDropCount++;
  }
}
