varying vec3 vPosition;
varying vec2 vUv;

void main() {
  vPosition = (modelMatrix * vec4(position, 1)).xyz;
  vUv = uv;
  gl_Position = projectionMatrix * viewMatrix * vec4(vPosition, 1);
}
