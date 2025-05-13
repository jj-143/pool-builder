import * as THREE from "three";

import config from "~/config";
import Coping from "~/lib/Pool/Coping";
import { segmentIntersect } from "~/lib/Pool/utils";

import Node from "./Node";
import Wall from "./Wall";

export interface ModelEventListener {
  onChange(start: number, points: THREE.Vector2[], nPoints: number): void;
  onChangeIsValid(isValid: boolean): void;
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
  private isValid = false;

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
   * Methods for updating walls & copings when there's node changes:
   * onInsertNode, onRemoveNode, onMoveNode, updateCopingEnd
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

    this.updateCopingEnd(i0);
    this.updateCopingEnd(i1);
    this.updateCopingEnd(i2);

    this.validate();
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

    this.updateCopingEnd(prev);
    this.updateCopingEnd(index % n);

    this.validate();
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

    this.updateCopingEnd(i0);
    this.updateCopingEnd(i1);
    this.updateCopingEnd(i2);

    this.validate();
  }

  /**
   * Updating Coping's position & UV for outer edge vertices position & UV.
   *
   * When i-th node (p1) is updated, the previous coping (p0) and the next
   * coping (p2) are affected. These 2 copings share one of their end's vertices
   * (ps) and its position and UV are changed; the 2 remaining vertices (@) are
   * unchanged.
   *
   * Indices
   * For coping-0 (p1-p0-@1-ps), ps is at index-3, whereas for coping-1
   * (p2-p1-ps-@2), ps is at index-2.
   *
   * Position
   * ps := p1 + dh, where dh := normalize(DH(p2, p1) + DH(p1, p0))
   *
   * UV
   * For dh1 := DH(p1, p0), dh2:= DH(p2, p1) and let theta be angle between dh1
   * and dh2.
   *
   * For theta = 0, p0-p1-p2 is in line, and dh1 = dh2 = DH. The UV coordinate
   * of ps coping-0 is (0, 1) at index = 3, whereas for coping-1 is (1, 1) at
   * index = 2.
   *
   * As theta increases, UV.x < 0 for coping-0, and UV.x > 0 for coping-1.
   * As theta decreases, UV.x > 0 for coping-0, and UV.x < 0 for coping-1.
   *
   *
   *  <Convex>                 <Concave>
   *
   *        @2-----ps                      @1     /
   *       /======/==\                    /==\   /
   *      /======/====\                  /====\ /
   *  ---p2----p1=====@1        @2----ps======p0
   *            \=====/          \======\====/
   *      Pool   \===/            \======\==/   Pool
   *              p0           ----p2-----p1
   *               \
   *
   *  <DH>
   *
   *          <dh2>   _<DH>
   *            |   _/
   *            | _/
   *  ---p2-----p1----<dh1>
   *            |
   *      Pool  |
   *            p0
   *            |
   *
   */
  private updateCopingEnd(i: number) {
    const { nodes, walls } = this;
    const n = walls.length;
    const h = config.COPING_SIZE;
    const [i0, i1, i2] = [(i - 1 + n) % n, i, (i + 1) % n];
    const [p0, p1, p2] = [nodes[i0].point, nodes[i1].point, nodes[i2].point];
    const [cp0, cp1] = [walls[i0].copingMesh, walls[i1].copingMesh];

    const [dh0, dh1] = [Coping.DH(p0, p1), Coping.DH(p1, p2)];
    const dh = dh0.clone().add(dh1).normalize();

    const sinTheta = -dh0.cross(dh1);
    const cosHalfTheta = dh.dot(dh0);
    const tanHalfTheta = Math.sqrt(1 / (cosHalfTheta * cosHalfTheta) - 1);

    /* Update Positions */
    const ps = p1.clone().addScaledVector(dh, h / cosHalfTheta);

    cp0.baPosition.setXYZ(3, ps.x, 0, ps.y);
    cp1.baPosition.setXYZ(2, ps.x, 0, ps.y);
    cp0.baPosition.needsUpdate = true;
    cp1.baPosition.needsUpdate = true;

    /* Update UVs */
    const dUVx = h * tanHalfTheta * Math.sign(sinTheta);
    const uvx0 = 0 - dUVx / p0.distanceTo(p1);
    const uvx1 = 1 + dUVx / p1.distanceTo(p2);

    cp0.geometry.getAttribute("uv").setX(3, uvx0);
    cp1.geometry.getAttribute("uv").setX(2, uvx1);
    cp0.geometry.getAttribute("uv").needsUpdate = true;
    cp1.geometry.getAttribute("uv").needsUpdate = true;
  }

  /**
   * Check model validity, mark as such, and notify the listener
   */
  private validate() {
    const isValidNew = !this.hasIntersection();
    if (this.isValid === isValidNew) return;
    this.isValid = isValidNew;
    this.listener?.onChangeIsValid(isValidNew);
  }

  /**
   * @returns `true` if wall i & wall j intersects
   */
  private wallIntersect(i: number, j: number): boolean {
    const iEnd = (i + 1) % this.nodes.length;
    const jEnd = (j + 1) % this.nodes.length;

    const [pStart, pEnd, qStart, qEnd] = [i, iEnd, j, jEnd].map(
      (idx) => this.nodes[idx].point,
    );

    return segmentIntersect(pStart, pEnd, qStart, qEnd);
  }

  /**
   * Check if there's any wall intersection.
   * NOTE: Ajacent walls are *NOT* considered as an intersection.
   */
  hasIntersection(): boolean {
    const n = this.nodes.length;

    for (let i = 0; i < n; i++) {
      // Skip same wall and the next wall
      for (let j = i + 2; j < n; j++) {
        const [jStart, jEnd] = [j % n, (j + 1) % n];

        if (jEnd == i) continue; // only for (i=0) && (jEnd is the last node)

        if (this.wallIntersect(i, jStart)) return true;
      }
    }

    return false;
  }
}
