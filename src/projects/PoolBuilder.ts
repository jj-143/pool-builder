import * as THREE from "three";

import App from "@core/App";
import Project from "@core/Project";

import Pool from "~/lib/Pool";
import { DropHelper } from "~/lib/Pool/Helpers";
import { uniforms } from "~/lib/shared";
import { createSphere } from "~/utils";

export default class PoolBuilder extends Project {
  pool: Pool;
  clock: THREE.Clock;
  dropHelper: DropHelper;

  constructor() {
    super();
    this.pool = new Pool();
    this.clock = new THREE.Clock();
    this.dropHelper = new DropHelper(this.pool);
  }

  override async load() {
    await super.load();
    await this.loadTextures();
  }

  override start() {
    this.camera.position.set(0, 3, 2);
    this.camera.lookAt(0, 1, 0);
    this.pool.init();
    this.initSun();
    this.drawPlus();
    this.dropHelper.attachDragWater();
    App.renderer.autoClear = false; // For WaterSimulation
  }

  override animate() {
    if (App.instance.animationState === "play") {
      if (this.clock.getElapsedTime() > 1 / 120) {
        this.pool.sim.stepSimulation();
        this.clock.start();
      }
    }
    this.render();
  }

  override toggleOverlays() {
    super.toggleOverlays();
    this.pool.toggleMode();
  }

  private initSun() {
    const sun = createSphere(uniforms["sun"].value);
    this.attachControl(sun, () => {
      uniforms["sun"].value.copy(sun.position);
    });
    this.uiGroup.add(sun);
  }

  private async loadTextures() {
    const col = (await import("~/assets/Tiles132A/col.jpg")).default;
    const nrm = (await import("~/assets/Tiles132A/nrm.jpg")).default;

    const texture = new THREE.TextureLoader().load(col);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;

    const normalTexture = new THREE.TextureLoader().load(nrm);
    normalTexture.wrapS = THREE.RepeatWrapping;
    normalTexture.wrapT = THREE.RepeatWrapping;

    uniforms["tile"].value = texture;
    uniforms["tileNrm"].value = normalTexture;
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
