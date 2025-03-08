/**
 * Find the intersection of a ray and the pool geometry, represented by an array
 * of points (Node).
 *
 * NOTE: Points are ordered in counter-clock-wise, and Wall is front-facing when
 * ray crossing a wall direction from left to right, i.e, cross(ray, wall) > 0.
 *
 * First obtain s := dist(OP, P) / norm(seg) using 2 sine laws,
 * and check for boundary for ray - segment intersection. Next, obtain t for
 * intersection point P := pos + t * dir. Find the closest front-facing one.
 *
 * Since pool is planar, calculation can be done in XZ plane.
 *
 * NOTE: There's a small optimization for **convex geometries** by early
 * returning the result after finding the first front-facing intersection point
 * since it's unique.
 */

const int N_POINTS = 50;
uniform vec2[N_POINTS] points;
uniform int nPoints;

#define cross2(a, b) (a.x * b.y - a.y * b.x)

int intersectPool(vec3 pos3, vec3 dir3, out float t) {
  t = 1000.0;
  int found = -1;
  vec2 dir = dir3.xz;
  vec2 pos = pos3.xz;

  for (int i = 0; i < nPoints; i++) {
    int j = (i + 1) % nPoints;
    vec2 op = points[j] - pos;
    vec2 seg = points[j] - points[i];

    float s = cross2(dir, op) / cross2(dir, seg);
    if (s < 0.0 || s > 1.0) continue;

    vec2 p = op - s * seg;
    float ti = p.x / dir.x;
    if (ti < 0.0 || ti > t) continue;

    t = ti;
    found = cross2(op, seg) < 0.0 ? i : -1;
  }

  return found;
}
