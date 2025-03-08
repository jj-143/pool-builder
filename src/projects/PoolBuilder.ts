import * as THREE from "three";

import App from "@core/App";
import Project from "@core/Project";

import assets from "~/assets";
import DrawHelper from "~/helpers/DrawHelper";
import DropHelper from "~/helpers/DropHelper";
import Pool from "~/lib/Pool";
import uniforms from "~/uniforms";
import { createSphere, importTexture } from "~/utils";

export default class PoolBuilder extends Project {
  pool: Pool;
  clock: THREE.Clock;
  drawHelper: DrawHelper;
  dropHelper: DropHelper;

  constructor() {
    super();
    this.pool = new Pool();
    this.clock = new THREE.Clock();
    this.drawHelper = new DrawHelper(this.pool);
    this.dropHelper = new DropHelper(this.pool);
  }

  override async load() {
    await super.load();
    await this.loadTextures();
  }

  override start() {
    App.renderer.autoClear = false; // For WaterSimulation

    this.camera.position.set(0, 3, 2);
    this.camera.lookAt(0, 1, 0);
    this.pool.init();
    this.initSun();
    this.initEnvironmentMap();

    /* Helpers */
    this.dropHelper.attachDragWater();
    this.drawHelper.drawPlus();
  }

  override animate() {
    if (App.instance.animationState === "play") {
      if (this.clock.getElapsedTime() > 1 / 120) {
        this.pool.sim.stepSimulation();
        this.clock.start();
      }
    }
    this.pool.caustics.render();
    this.render();
  }

  override toggleOverlays() {
    super.toggleOverlays();
    this.pool.toggleMode("normal");
  }

  private initSun() {
    const sun = createSphere(uniforms["light"].value);
    this.attachControl(sun, () => {
      uniforms["light"].value.copy(sun.position).normalize();
    });
    this.uiGroup.add(sun);
  }

  private async loadTextures() {
    return Promise.all([
      importTexture(assets.tileCol, "tileCol"),
      importTexture(assets.tileNrm, "tileNrm"),
      importTexture(assets.worldCol, "worldCol"),
      importTexture(assets.worldNrm, "worldNrm"),
      importTexture(assets.copingCol, "copingCol"),
      importTexture(assets.copingNrm, "copingNrm"),
      importTexture(assets.envMap, "envMap"),
    ]);
  }

  private async initEnvironmentMap() {
    const texture = uniforms["envMap"].value!;
    texture.mapping = THREE.EquirectangularReflectionMapping;
    this.scene.background = texture;
  }
}
