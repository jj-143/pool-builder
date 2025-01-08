varying vec3 vPosition;
varying vec2 vUv;

uniform float surfaceY;

void main() {
  vUv = uv;
  vPosition = (modelMatrix * vec4(position, 1)).xyz;
  gl_Position = projectionMatrix * viewMatrix * vec4(vPosition, 1);
}
