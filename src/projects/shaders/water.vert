uniform float poolSize;
uniform sampler2D water;

varying vec3 vPosition;

void main() {
  vec3 modelPos = (modelMatrix * vec4(position, 1)).xyz;
  vec4 info = texture2D(water, modelPos.xz / poolSize + 0.5);

  vPosition = modelPos;
  modelPos.y += info.r;
  gl_Position = projectionMatrix * viewMatrix * vec4(modelPos, 1);
}
