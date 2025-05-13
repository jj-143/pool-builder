import * as THREE from "three";

/**
 * Taken from the internet.
 *
 * Basically it's cross2(p0p1, p0p2) > 0.
 */
function ccw(p0: THREE.Vector2, p1: THREE.Vector2, p2: THREE.Vector2) {
  return (p2.y - p0.y) * (p1.x - p0.x) > (p1.y - p0.y) * (p2.x - p0.x);
}

/**
 * Taken from the internet as `ccw()`.
 *
 * In short, it checks if it satisfies:
 * 1) P starts and ends at different sides of Q
 * 2) Q starts and ends at different sides of P
 *
 * @returns `true` if 2 line segments ([pStart, pEnd], [qStart, qEnd])
 * has an intersection.
 */
export function segmentIntersect(
  pStart: THREE.Vector2,
  pEnd: THREE.Vector2,
  qStart: THREE.Vector2,
  qEnd: THREE.Vector2,
): boolean {
  return (
    ccw(pStart, qStart, qEnd) != ccw(pEnd, qStart, qEnd) &&
    ccw(pStart, pEnd, qStart) != ccw(pStart, pEnd, qEnd)
  );
}
