varying vec3 vPosition;
varying vec2 vUv;

uniform vec3 light;
uniform float lightIntensity;

uniform sampler2D worldCol;
uniform sampler2D worldNrm;
uniform float worldRepeat;
uniform float worldSize;

const float PI = 3.14159;
const float INV_PI = 1.0 / 3.14159265;

float AMBIENT = 0.4;

// Modified Blinn-Phong
const float r_d = 0.98;
const float r_s = 1.0 - r_d;
const float n_s = 20000.0;

// Normalization factor for specular, for large n_s
const float N = (n_s + 6.0) / (8.0 * PI); 

void main() {
  vec2 coords = fract(vUv * worldSize / worldRepeat);

  vec3 col = texture2D(worldCol, coords).rgb;
  vec3 nrm = normalize(texture2D(worldNrm, coords).rgb * 2.0 - 1.0);
  vec3 normal = vec3(nrm.x, nrm.z, -nrm.y);

  vec3 view = normalize(cameraPosition - vPosition);
  vec3 halfway = normalize(view + light);

  float NoL = clamp(dot(normal, light), 0.0, 1.0);
  float NoH = clamp(dot(normal, halfway), 0.0, 1.0);

  vec3 diff = r_d * INV_PI * col;
  float spec = r_s * N * pow(NoH , n_s);
  vec3 color = AMBIENT * col + lightIntensity * NoL * (diff + spec);
  gl_FragColor = vec4(color, 1);
}
