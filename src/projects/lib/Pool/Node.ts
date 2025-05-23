import * as THREE from "three";
import { TransformControls } from "three/examples/jsm/controls/TransformControls";

import App from "@core/App";

import config from "~/config";

const COLOR_NORMAL = "lightseagreen";
const COLOR_ACTIVE = "gold";

export default class Node extends THREE.Mesh {
  point: THREE.Vector2;
  private control: TransformControls;
  private onMove: (position: THREE.Vector3) => void;

  constructor(point: THREE.Vector3, onMove: (position: THREE.Vector3) => void) {
    const project = App.instance.project!;

    const sphere = new THREE.SphereGeometry(0.02, 12, 8);
    const material = new THREE.MeshBasicMaterial({
      color: COLOR_NORMAL,
      depthTest: false,
    });
    super(sphere, material);

    this.position.copy(point);
    this.name = "node";
    this.point = new THREE.Vector2(point.x, point.z);
    this.renderOrder = 11;
    this.onMove = onMove;

    this.control = project.attachControl(this, this.onControlChange.bind(this));
    this.control.showY = false;
    project.uiGroup.add(this);
    this.setActive(false);
  }

  private clampToSurfaceBound() {
    const halfW = config.POOL_SIZE / 2;
    this.position.x = THREE.MathUtils.clamp(this.position.x, -halfW, halfW);
    this.position.z = THREE.MathUtils.clamp(this.position.z, -halfW, halfW);
  }

  private onControlChange() {
    this.clampToSurfaceBound();

    const didntMove =
      this.point.x == this.position.x && this.point.y == this.position.z;
    if (didntMove) return;
    this.point.set(this.position.x, this.position.z);
    this.onMove(this.position);
  }

  dispose() {
    this.control.object.removeFromParent();
    this.control.dispose();
    this.control.getHelper().removeFromParent();
    this.control.detach();
    this.control.disconnect();
  }

  setActive(set: boolean) {
    this.control.getHelper().visible = set;
    this.control.enabled = set;
    (this.material as THREE.MeshBasicMaterial).color.setColorName(
      set ? COLOR_ACTIVE : COLOR_NORMAL,
    );
  }
}
