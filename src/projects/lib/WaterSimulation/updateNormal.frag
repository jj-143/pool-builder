precision highp float;
precision highp int;

uniform sampler2D water;
uniform vec2 delta;
varying vec2 coord;

void main() {
  vec4 info = texture2D(water, coord);

  /* update the normal */
  vec3 ddx = vec3(delta.x, texture2D(water, coord + vec2(delta.x, 0)).r - info.r, 0.0);
  vec3 ddy = vec3(0.0, texture2D(water, coord + vec2(0, delta.y)).r - info.r, delta.y);
  info.ba = normalize(cross(ddy, ddx)).xz;

  gl_FragColor = info;
}