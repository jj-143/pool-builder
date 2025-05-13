uniform float width;
uniform float height;
uniform float poolDepth;
uniform bool isCoping;
uniform bool isPoolValid;

uniform vec3 light;
uniform float lightIntensity;

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

const float PI = 3.14159;
const float INV_PI = 1.0 / 3.14159265;

float AMBIENT_WALL = 0.4;
float AMBIENT_COPING = 0.2;

// Modified Blinn-Phong
const float r_d = 0.98;
const float r_s = 1.0 - r_d;
const float n_s = 20000.0;

// Normalization factor for specular, for large n_s
const float N = (n_s + 6.0) / (8.0 * PI); 

void main() {
  mat3 TBN = mat3(vTangent, vBitangent, vNormal);
  vec2 coords;
  vec4 tileColor;
  vec3 tileNormal;
  float ambient;

  if (isCoping) {
    ambient = AMBIENT_COPING;
    coords = fract(vUv * vec2(width, height) / copingRepeat);
    tileColor = texture2D(copingCol, coords);
    tileNormal = normalize(texture2D(copingNrm, coords).rgb * 2.0 - 1.0);
  } else {
    ambient = AMBIENT_WALL;
    coords = fract(vUv * vec2(width, poolDepth) / tileRepeat);
    tileColor = texture2D(tileCol, coords);
    tileNormal = normalize(texture2D(tileNrm, coords).rgb * 2.0 - 1.0);
  }

  vec3 normal = normalize(TBN * tileNormal.rgb);
  vec3 view = normalize(cameraPosition - vPosition);
  vec3 halfway = normalize(view + light);

  float NoL = clamp(dot(normal, light), 0.0, 1.0);
  float NoH = clamp(dot(normal, halfway), 0.0, 1.0);

  vec3 diff = r_d * INV_PI * tileColor.rgb;
  float spec = r_s * N * pow(NoH , n_s);
  vec3 color = ambient * tileColor.rgb + lightIntensity * NoL * (diff + spec);

  if (!isPoolValid) {
    color = mix(color, vec3(1,0,0), 0.8);
  }

  gl_FragColor = vec4(color, 1);
}
