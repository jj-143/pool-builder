import * as THREE from "three";
import { TransformControls } from "three/examples/jsm/controls/TransformControls";

import App from "@core/App";
import TextureOverlay from "@core/utils/TextureOverlay";

export default class Project {
  scene: THREE.Scene;
  camera!: THREE.PerspectiveCamera;
  uiGroup: THREE.Group;
  textureOverlay: TextureOverlay;

  constructor() {
    this.scene = new THREE.Scene();
    this.uiGroup = new THREE.Group();
    this.scene.add(this.uiGroup);
    this.textureOverlay = new TextureOverlay();
  }

  animate() {
    this.render();
    if (this.uiGroup.visible) {
      this.textureOverlay.render();
    }
  }

  async load() {
    this.camera = this.createDefaultCamera();
    this.scene.add(this.camera);
  }

  render() {
    App.renderer.render(this.scene, this.camera);
  }

  start() {}

  onContainerResize(width: number, height: number) {
    this.textureOverlay.updateDimensions();
  }

  toggleOverlays() {
    this.uiGroup.visible = !this.uiGroup.visible;
  }

  attachControl(
    object: THREE.Object3D,
    onChange?: THREE.EventListener<{}, "change", TransformControls>,
  ) {
    const control = new TransformControls(this.camera, App.renderer.domElement);
    control.setSize(0.4);
    control.attach(object);

    if (onChange) {
      control.addEventListener("change", onChange);
    }

    control.addEventListener("dragging-changed", ({ value }) => {
      if (value) {
        App.instance.setUIControlState("interacting");
      }
    });

    this.uiGroup.add(control.getHelper());
    return control;
  }

  detachControl(control: TransformControls) {
    const helper = control.getHelper();
    helper.removeFromParent();
    this.uiGroup.remove(helper);
    control.dispose();
  }

  private createDefaultCamera(): THREE.PerspectiveCamera {
    const camera = new THREE.PerspectiveCamera(
      50,
      window.innerWidth / window.innerHeight,
      0.01,
      100,
    );

    camera.position.set(5, 5, 8);
    camera.name = "main-camera";
    return camera;
  }
}
