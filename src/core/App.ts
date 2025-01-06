import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

import Project from "@core/Project";

type UIControlState = "idle" | "viewport-camera" | "interacting";
type AnimationState = "play" | "stop";

export default class App {
  animationState: AnimationState = "play";
  uiControlState: UIControlState = "idle";

  renderer: THREE.WebGLRenderer;
  project?: Project;

  // Helpers
  orbitControl?: OrbitControls;
  axesHelper?: THREE.AxesHelper;
  gridHelper?: THREE.GridHelper;

  static instance: App;
  static renderer: THREE.WebGLRenderer;

  constructor() {
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
    });

    this.renderer = renderer;
    App.renderer = renderer;
    App.instance = this;

    const container = document.createElement("div");
    document.body.appendChild(container);

    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(renderer.domElement);

    this.addShortcuts();
    document.addEventListener("click", () => this.setUIControlState("idle"));
  }

  async loadProject(project: Project) {
    await project.load();
    this.project = project;
    this.setupHelpers(project);
    window.addEventListener("resize", this.onWindowResize.bind(this));
    project.start();
  }

  toggleOverlays() {
    this.project?.toggleOverlays();
    this.axesHelper?.layers.toggle(0);
    this.gridHelper?.layers.toggle(0);
  }

  toggleAnimationState(set?: boolean) {
    set = set ?? this.animationState !== "play";
    const newState = set ? "play" : "stop";
    this.animationState = newState;
  }

  setUIControlState(newState: UIControlState) {
    this.uiControlState = newState;

    if (!this.orbitControl) return;

    const canControlOrbitControl =
      this.uiControlState === "viewport-camera" ||
      this.uiControlState === "idle";
    this.orbitControl.enabled = canControlOrbitControl;
  }

  private addOrbitControls(camera: THREE.Camera) {
    const controls = new OrbitControls(camera, this.renderer.domElement);
    controls.minDistance = 0.01;
    controls.maxDistance = 1000;
    controls.target.set(0, 1, 0);
    controls.update();

    controls.addEventListener("change", (event) => {
      if (this.uiControlState !== "viewport-camera") {
        this.setUIControlState("viewport-camera");
      }
    });

    this.orbitControl = controls;
  }

  private setupHelpers(project: Project) {
    this.addOrbitControls(project.camera);

    // AxesHelper
    const axesSize = 10;
    this.axesHelper = new THREE.AxesHelper(axesSize);
    project.scene.add(this.axesHelper);

    // GridHelper
    const gridSize = 10;
    const gridDivisions = 10;
    this.gridHelper = new THREE.GridHelper(gridSize, gridDivisions);
    project.scene.add(this.gridHelper);
  }

  private onWindowResize() {
    if (this.project) {
      this.project.camera.aspect = window.innerWidth / window.innerHeight;
      this.project.camera.updateProjectionMatrix();
    }
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.project?.render();
  }

  private addShortcuts() {
    document.addEventListener("keydown", (event) => {
      // Hide Overlays
      if (event.code === "KeyZ" && event.altKey && event.shiftKey) {
        this.toggleOverlays();
        return;
      }

      // Play/Pause Animation State
      if (event.code === "Space") {
        this.toggleAnimationState();
        return;
      }
    });
  }
}
