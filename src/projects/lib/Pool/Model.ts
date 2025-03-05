import * as THREE from "three";

import Node from "./Node";
import Wall from "./Wall";

export interface ModelEventListener {
  onChange(start: number, points: THREE.Vector2[], nPoints: number): void;
}

/**
 * NOTE: The path is CCW order (right hand rule), and the inner face of the pool
 * is front facing.
 */
export default class Model {
  nodes: Node[] = [];
  walls: Wall[] = [];
  root: THREE.Object3D;
  private listener?: ModelEventListener;

  constructor(listener?: ModelEventListener) {
    this.root = new THREE.Object3D();
    this.listener = listener;
  }

  insertNode(index: number, origin: THREE.Vector3): Node {
    const newNode = new Node(origin, () => {
      const index = this.nodes.indexOf(newNode);
      this.onMoveNode(index);
      this.listener?.onChange(index, [newNode.point], this.nodes.length);
    });
    this.nodes.splice(index, 0, newNode);

    const points = this.nodes.map((node) => node.point);
    this.onInsertNode(index);
    this.listener?.onChange(0, points, this.nodes.length);
    return newNode;
  }

  removeNode(node: Node) {
    const index = this.nodes.indexOf(node);
    this.nodes.splice(index, 1);
    node.dispose();

    const points = this.nodes.map((node) => node.point);
    this.onRemoveNode(index);
    this.listener?.onChange(0, points, this.nodes.length);
  }

  splitWall(wall: Wall["wallMesh"]): Node {
    const i0 = this.walls.map((it) => it.wallMesh).indexOf(wall);
    const i1 = (i0 + 1) % this.nodes.length;
    const start = this.nodes[i0];
    const end = this.nodes[i1];
    const mid = start.position.clone().add(end.position).divideScalar(2);
    return this.insertNode(i0 + 1, mid);
  }

  clear() {
    this.nodes.forEach((node) => {
      node.dispose();
    });
    this.nodes.splice(0, this.nodes.length);
    this.walls.splice(0, this.walls.length);
    this.root.clear();
    this.listener?.onChange(0, [], 0); // Setting n=0 is sufficient
  }

  /* ------------------------------------------------------------ */
  /**
   * Methods for updating walls when there's node changes:
   * onInsertNode, onRemoveNode, onMoveNode
   */
  private onInsertNode(index: number) {
    const n = this.nodes.length;
    if (n < 2) return;

    // Start with 2 walls
    if (n == 2) {
      const wall01 = new Wall([this.nodes[0], this.nodes[1]]);
      const wall10 = new Wall([this.nodes[1], this.nodes[0]]);
      this.walls.push(wall01);
      this.walls.push(wall10);
      this.root.add(wall01);
      this.root.add(wall10);
      return;
    }

    // Update previous wall to [prev.start, newNode] &
    // create new wall with [newNode, prev.end]
    const i0 = (index - 1 + n) % n;
    const i1 = index;
    const i2 = (index + 1) % n;

    this.walls[i0].update([this.nodes[i0], this.nodes[i1]]);
    const newLastWall = new Wall([this.nodes[i1], this.nodes[i2]]);
    this.walls.splice(i1, 0, newLastWall);
    this.root.add(newLastWall);
  }

  private onRemoveNode(index: number) {
    const n = this.walls.length - 1;
    const prev = (index - 1 + n) % n;
    const thisWall = this.walls.splice(index, 1)[0];
    const prevWall = this.walls[prev];
    const prevNode = this.nodes[prev];
    const nextNode = this.nodes[index % n];
    this.root.remove(thisWall);
    prevWall.update([prevNode, nextNode]);
  }

  private onMoveNode(index: number) {
    const n = this.walls.length;
    if (!n) return;
    const i0 = (index - 1 + n) % n;
    const i1 = index;
    const i2 = (index + 1) % n;

    const wall0 = this.walls[i0];
    const wall1 = this.walls[i1];
    wall0.update([this.nodes[i0], this.nodes[i1]]);
    wall1.update([this.nodes[i1], this.nodes[i2]]);
  }
}
