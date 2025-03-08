import * as THREE from "three";

import App from "@core/App";

import config from "~/config";
import StencilHelper from "~/helpers/StencilHelper";
import Caustics from "~/lib/Caustics";
import WaterSimulation from "~/lib/WaterSimulation";
import uniforms from "~/uniforms";

import intersectPool from "~/shaders/intersectPool.glsl?raw";
import waterFrag from "~/shaders/water.frag?raw";
import waterVert from "~/shaders/water.vert?raw";
import worldFrag from "~/shaders/world.frag?raw";
import worldVert from "~/shaders/world.vert?raw";

import Model, { ModelEventListener } from "./Model";
import type Node from "./Node";
import type Wall from "./Wall";

type Mode = "normal" | "edit";

export default class Pool implements ModelEventListener {
  mode: Mode = "normal";
  selectedNode: Node | null = null;

  private nodeGap = 0.1;
  private model!: Model;
  private unsubscribeClickEvent?: () => void;

  sim: WaterSimulation;
  caustics: Caustics;
  private world!: THREE.Mesh;
  private worldBoundary!: THREE.LineSegments;
  private stencilHelper: StencilHelper;

  constructor() {
    this.model = new Model(this);
    this.sim = new WaterSimulation();
    this.caustics = new Caustics();
    this.stencilHelper = new StencilHelper(this);
  }

  init() {
    this.initSurface();
    this.world = this.initWorld();
    this.worldBoundary = this.initWorldBoundary();

    App.instance.project?.scene.add(this.model.root);
    this.attachShortcuts();
  }

  toggleMode(mode?: Mode) {
    mode = mode ?? (this.mode === "normal" ? "edit" : "normal");
    if (this.mode === mode) return;
    this.mode = mode;

    switch (mode) {
      case "edit":
        this.unsubscribeClickEvent = App.instance.addClickEventListener(
          this.handleWorldClick.bind(this),
        );
        break;
      case "normal":
      default:
        this.unsubscribeClickEvent?.();
        this.clearSelection();
        break;
    }

    // Update UI visibility
    this.model.nodes.forEach((node) => {
      node.visible = this.mode === "edit";
    });
    this.worldBoundary.visible = this.mode === "edit";
  }

  appendNode(origin: THREE.Vector3) {
    const isClose = !!this.model.nodes.find(
      (it) => it.position.distanceTo(origin) < this.nodeGap,
    );
    if (isClose) return;

    const newIndex = this.model.nodes.length;
    const node = this.model.insertNode(newIndex, origin);
    node.visible = this.mode === "edit";
  }

  selectNode(node: Node) {
    this.selectedNode?.setActive(false);
    this.selectedNode = node;
    node.setActive(true);
  }

  clearSelection() {
    this.selectedNode?.setActive(false);
    this.selectedNode = null;
  }

  clear() {
    this.clearSelection();
    this.model.clear();
  }

  /**
   * @implements {ModelEventListener}
   */
  onChange(start: number, points: THREE.Vector2[], nPoints: number): void {
    uniforms["points"].value.splice(start, points.length, ...points);
    uniforms["nPoints"].value = nPoints;
    this.stencilHelper.updateStencil();

    if (App.instance.animationState == "stop") {
      this.sim.updateNormal();
    }
  }

  private initSurface() {
    const geometry = new THREE.PlaneGeometry(
      config.POOL_SIZE,
      config.POOL_SIZE,
      200,
      200,
    );
    geometry.rotateX(-Math.PI / 2);

    const material = new THREE.ShaderMaterial({
      vertexShader: waterVert,
      fragmentShader: intersectPool + waterFrag,
      uniforms: uniforms,
      defines: config.DEFINES,

      stencilRef: 1,
      stencilWrite: true,
      stencilFunc: THREE.EqualStencilFunc,
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.setY(config.SURFACE_Y);
    mesh.renderOrder = 1; // after stencil
    App.instance.project!.scene.add(mesh);
    return mesh;
  }

  private initWorld() {
    const geometry = new THREE.PlaneGeometry(
      config.WORLD_SIZE,
      config.WORLD_SIZE,
    );
    geometry.rotateX(-Math.PI / 2);

    const material = new THREE.ShaderMaterial({
      vertexShader: worldVert,
      fragmentShader: worldFrag,
      uniforms: uniforms,

      stencilRef: 1,
      stencilWrite: true,
      stencilFunc: THREE.NotEqualStencilFunc,
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.renderOrder = 1; // after stencil
    App.instance.project!.scene.add(mesh);
    return mesh;
  }

  private initWorldBoundary() {
    App.instance.gridHelper?.dispose();
    App.instance.gridHelper?.removeFromParent();

    const lines = new THREE.GridHelper(config.POOL_SIZE, 1, "white", "white");

    lines.renderOrder = 10;
    lines.material.linewidth = 8;
    lines.material.depthTest = false;
    lines.visible = this.mode === "edit";

    App.instance.project!.scene.add(lines);
    return lines;
  }

  private handleWorldClick(rc: THREE.Raycaster, { button }: MouseEvent) {
    // Hover on Node
    {
      const nodeOnHover = rc.intersectObjects(this.model.nodes, false)[0]
        ?.object as Node | undefined;

      if (nodeOnHover) {
        // Select
        if (button == 0) {
          this.selectNode(nodeOnHover);
          return;
        }

        // Remove
        if (button == 2) {
          this.clearSelection();
          this.model.removeNode(nodeOnHover);
          return;
        }
      }
    }

    // Hover on Wall
    {
      const wallOnHover = rc.intersectObjects(
        this.model.walls.map((it) => it.wallMesh),
        false,
      )[0]?.object as Wall["wallMesh"] | undefined;

      if (wallOnHover) {
        // Split Wall in half
        if (button == 0) {
          const node = this.model.splitWall(wallOnHover);
          this.selectNode(node);
          return;
        }
      }
    }

    // On empty area, has selection
    if (this.selectedNode) {
      // Clear selection
      if (button == 0) {
        this.clearSelection();
      }

      // Remove the selected Node
      if (button == 2) {
        if (this.selectedNode) {
          this.model.removeNode(this.selectedNode);
          this.clearSelection();
        }
      }
      return;
    }

    // On empty area, no selection
    if (button == 0) {
      // Append Node at the end
      const intersect = rc.intersectObject(this.world);
      if (intersect.length) {
        const point = intersect[0].point;
        this.appendNode(point);
        return;
      }
    }
  }

  private attachShortcuts() {
    document.addEventListener("keydown", (e) => {
      if (e.key == "Escape") {
        this.clearSelection();
        return;
      }

      if (e.key === "Tab") {
        e.preventDefault();
        this.toggleMode();
        return;
      }

      if (e.key === "c" && e.ctrlKey) {
        this.clear();
        return;
      }
    });
  }
}
