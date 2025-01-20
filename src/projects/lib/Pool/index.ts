import * as THREE from "three";

import App from "@core/App";

import WaterSimulation from "~/WaterSimulation";
import { config } from "~/config";
import { StencilHelper } from "~/lib/Pool/Helpers";
import { uniforms } from "~/lib/shared";

import waterFrag from "~/shaders/water.frag?raw";
import waterVert from "~/shaders/water.vert?raw";

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
  surface?: THREE.Mesh;
  private stencil?: THREE.Mesh;
  private stencilHelper: StencilHelper;

  constructor() {
    this.model = new Model(this);
    this.sim = new WaterSimulation();
    this.stencilHelper = new StencilHelper(this);
    uniforms["water"].value = this.sim.target.texture;
  }

  init() {
    this.surface = this.initSurface();
    this.updateStencil();

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
          this.handleSurfaceClick.bind(this),
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
    this.updateStencil();
  }

  private initSurface() {
    const geometry = new THREE.PlaneGeometry(
      config.POOL_SIZE,
      config.POOL_SIZE,
      500,
      500,
    );
    geometry.rotateX(-Math.PI / 2);

    const material = new THREE.ShaderMaterial({
      vertexShader: waterVert,
      fragmentShader: waterFrag,
      uniforms: uniforms,

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

  /**
   * @remarks: Recreate the stencil mesh for now.
   */
  private updateStencil() {
    this.stencil?.removeFromParent();
    const points = uniforms["points"].value.slice(0, uniforms["nPoints"].value);
    this.stencil = this.stencilHelper.create(points);
    this.sim.stencil = this.stencil;
    App.instance.project!.scene.add(this.stencil);
  }

  private handleSurfaceClick(rc: THREE.Raycaster, { button }: MouseEvent) {
    if (!this.surface) throw Error("Water surface has not set");

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
      const wallOnHover = rc.intersectObjects(this.model.walls, false)[0]
        ?.object as Wall | undefined;

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
      const intersect = rc.intersectObject(this.surface);
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
