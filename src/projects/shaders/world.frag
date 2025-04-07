varying vec3 vPosition;
varying vec2 vUv;

uniform vec3 light;
uniform float lightIntensity;

uniform sampler2D worldCol;
uniform sampler2D worldNrm;
uniform float worldRepeat;
uniform float worldSize;

float AMBIENT = 0.2;

void main() {
  vec2 coords = fract(vUv * worldSize / worldRepeat);

  vec3 col = texture2D(worldCol, coords).rgb;
  vec3 nrm = normalize(texture2D(worldNrm, coords).rgb * 2.0 - 1.0);
  vec3 normal = vec3(nrm.x, nrm.z, -nrm.y);

  vec3 view = normalize(cameraPosition - vPosition);
  vec3 r = normalize(reflect(-view, normal));

  float diff = clamp(lightIntensity * dot(normal, light), 0.0, 1.0);
  float spec = lightIntensity * pow(clamp(dot(light, r), 0.0, 1.0) , 1500.0);

  vec3 color = (diff + AMBIENT) * col * 0.9 + spec * 1.0;
  gl_FragColor = vec4(color, 1);
}
