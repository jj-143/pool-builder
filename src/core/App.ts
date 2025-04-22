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
  static container: HTMLElement;
  static containerSize: [number, number] = [0, 0];

  constructor(
    container: HTMLElement,
    parameters?: THREE.WebGLRendererParameters,
  ) {
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      ...parameters,
    });

    this.renderer = renderer;
    App.renderer = renderer;
    App.instance = this;
    App.container = container;

    renderer.setPixelRatio(window.devicePixelRatio);
    App.container.appendChild(renderer.domElement);

    this.addShortcuts();
    App.container.addEventListener("pointerup", () =>
      this.setUIControlState("idle"),
    );
  }

  async loadProject(project: Project) {
    await project.load();
    this.project = project;
    this.setupHelpers(project);
    window.addEventListener("resize", this.onWindowResize.bind(this));
    this.onWindowResize();
    project.start();
    this.renderer.setAnimationLoop(project.animate.bind(project));
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

  addClickEventListener(
    callback: (raycaster: THREE.Raycaster, event: MouseEvent) => void,
  ) {
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();

    const handler = (event: MouseEvent) => {
      if (this.uiControlState != "idle") return;
      const [w, h] = App.containerSize;
      pointer.x = (event.offsetX / w) * 2 - 1;
      pointer.y = -(event.offsetY / h) * 2 + 1;
      raycaster.setFromCamera(pointer, this.project!.camera);
      callback(raycaster, event);
    };

    App.container.addEventListener("pointerup", handler, { capture: true });
    return () =>
      App.container.removeEventListener("pointerup", handler, {
        capture: true,
      });
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

    // Manual reset for end of scroll
    controls.addEventListener("end", () => {
      // Strictly check if it's in `viewport-camera` state.
      // Even though mouseButtons.LEFT is `null`, `end` event is still fired
      if (this.uiControlState === "viewport-camera") {
        this.setUIControlState("idle");
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

  private updateContainerSize() {
    const rect = App.container.getBoundingClientRect();
    App.containerSize = [
      rect.width || window.innerWidth,
      rect.height || window.innerHeight,
    ];
    return App.containerSize;
  }

  private onWindowResize() {
    const [w, h] = this.updateContainerSize();
    if (this.project) {
      this.project.camera.aspect = w / h;
      this.project.camera.updateProjectionMatrix();
    }
    this.renderer.setSize(w, h);
    this.project?.onContainerResize?.(w, h);
    this.project?.render();
  }

  private addShortcuts() {
    document.addEventListener("keydown", (e) => {
      // [Alt+Shift+Z] Hide Overlays
      if (e.key.toLowerCase() === "z" && e.altKey && e.shiftKey) {
        this.toggleOverlays();
        return;
      }

      // [Space] Play/Pause Animation State
      if (e.key === " ") {
        this.toggleAnimationState();
        return;
      }
    });
  }
}
