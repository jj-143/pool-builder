uniform vec3 sun;

uniform float width;
uniform float height;
uniform float poolDepth;
uniform bool isCoping;

uniform sampler2D tileCol;
uniform sampler2D tileNrm;
uniform float tileRepeat;

uniform sampler2D copingCol;
uniform sampler2D copingNrm;
uniform float copingRepeat;

varying vec3 vPosition;
varying vec2 vUv;
varying vec3 vTangent;
varying vec3 vBitangent;
varying vec3 vNormal;

float lightIntensity = 1.0;
float ambient = 0.05;

void main() {
  mat3 TBN = mat3(vTangent, vBitangent, vNormal);
  vec2 coords;
  vec4 tileColor;
  vec3 tileNormal;

  if (isCoping) {
    coords = fract(vUv * vec2(width, height) / copingRepeat);
    tileColor = texture2D(copingCol, coords);
    tileNormal = normalize(texture2D(copingNrm, coords).rgb * 2.0 - 1.0);
  } else {
    coords = fract(vUv * vec2(width, poolDepth) / tileRepeat);
    tileColor = texture2D(tileCol, coords);
    tileNormal = normalize(texture2D(tileNrm, coords).rgb * 2.0 - 1.0);
  }

  vec3 normal = normalize(TBN * tileNormal.rgb);

  vec3 eye = normalize(vPosition - cameraPosition);
  vec3 light = normalize(sun - vPosition);
  vec3 r = normalize(reflect(eye, normal));

  float diff = clamp(lightIntensity * dot(normal, light), 0.2, 1.0);
  float specular = lightIntensity * pow(clamp(dot(light, r), 0.0, 1.0) , 1500.0);

  vec3 color = (diff + ambient) * tileColor.rgb + specular * 10.0;
  gl_FragColor = vec4(color, 1);
}
