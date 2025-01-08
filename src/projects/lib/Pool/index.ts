import * as THREE from "three";

import App from "@core/App";

import { config } from "~/config";
import { uniforms } from "~/lib/shared";

import nodeViewerFrag from "~/shaders/node-viewer.frag?raw";
import waterVert from "~/shaders/water.vert?raw";

import Model, { ModelEventListener } from "./Model";
import type Node from "./Node";

type Mode = "normal" | "edit";

export default class Pool implements ModelEventListener {
  mode: Mode = "normal";
  selectedNode: Node | null = null;
  private nodeGap = 0.1;
  private model!: Model;
  private waterSurface?: THREE.Mesh;
  private unsubscribeClickEvent?: () => void;

  constructor() {
    this.model = new Model(this);
  }

  init() {
    this.waterSurface = this.initWaterSurface();
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
          this.handleWaterSurfaceClick.bind(this),
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
    uniforms.points.value.splice(start, points.length, ...points);
    uniforms.nPoints.value = nPoints;
  }

  private initWaterSurface() {
    const geometry = new THREE.PlaneGeometry(
      config.POOL_SIZE,
      config.POOL_SIZE,
    );
    geometry.rotateX(-Math.PI / 2);

    const material = new THREE.ShaderMaterial({
      vertexShader: waterVert,
      fragmentShader: nodeViewerFrag,
      uniforms: uniforms,
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.setY(config.SURFACE_Y);
    App.instance.project!.scene.add(mesh);
    return mesh;
  }

  private handleWaterSurfaceClick(rc: THREE.Raycaster, { button }: MouseEvent) {
    if (!this.waterSurface) throw Error("Water surface has not set");

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
      const intersect = rc.intersectObject(this.waterSurface);
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
