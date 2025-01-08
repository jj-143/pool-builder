import * as THREE from "three";

import Node from "./Node";

export interface ModelEventListener {
  onChange(start: number, points: THREE.Vector2[], nPoints: number): void;
}

export default class Model {
  nodes: Node[] = [];
  root: THREE.Object3D;
  private listener?: ModelEventListener;

  constructor(listener?: ModelEventListener) {
    this.root = new THREE.Object3D();
    this.listener = listener;
  }

  insertNode(index: number, origin: THREE.Vector3): Node {
    const newNode = new Node(origin, () => {
      const index = this.nodes.indexOf(newNode);
      this.listener?.onChange(index, [newNode.point], this.nodes.length);
    });
    this.nodes.splice(index, 0, newNode);

    const points = this.nodes.map((node) => node.point);
    this.listener?.onChange(0, points, this.nodes.length);
    return newNode;
  }

  removeNode(node: Node) {
    const index = this.nodes.indexOf(node);
    this.nodes.splice(index, 1);
    node.dispose();

    const points = this.nodes.map((node) => node.point);
    this.listener?.onChange(0, points, this.nodes.length);
  }

  clear() {
    this.nodes.forEach((node) => {
      node.dispose();
    });
    this.nodes.splice(0, this.nodes.length);
    this.root.clear();
    this.listener?.onChange(0, [], 0); // Setting n=0 is sufficient
  }
}
