uniform float poolSize;
uniform sampler2D water;

varying vec3 vPosition;
varying vec3 vNormal;

void main() {
  vPosition = (modelMatrix * vec4(position, 1)).xyz;
  vec4 info = texture2D(water, vPosition.xz / poolSize + 0.5);
  vPosition.y += info.r;
  vNormal = normalize(vec3(info.b, sqrt(1.0 - dot(info.ba, info.ba)), info.a)).xyz;
  gl_Position = projectionMatrix * viewMatrix * vec4(vPosition, 1);
}
