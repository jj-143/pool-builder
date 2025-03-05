uniform bool isCoping;

varying vec3 vPosition;
varying vec2 vUv;

varying vec3 vTangent;
varying vec3 vBitangent;
varying vec3 vNormal;

void main() {
  vUv = uv;
  vPosition = (modelMatrix * vec4(position, 1)).xyz;

  mat4 rotationMatrix = modelMatrix;
  rotationMatrix[3] = vec4(0,0,0,1);

  vNormal = (rotationMatrix * vec4(normal, 1)).xyz;

  if (isCoping) {
    vBitangent = vec3(0, 0, 1);
  } else {
    vBitangent = vec3(0, 1, 0);
  }

  vTangent = normalize(cross(vBitangent, vNormal));

  gl_Position = projectionMatrix * viewMatrix * vec4(vPosition, 1);
}
