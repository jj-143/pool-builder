uniform sampler2D water;
uniform sampler2D tile;
uniform sampler2D tileNrm;

uniform vec3 sun;

varying vec3 vPosition;
varying vec3 vNormal;
varying vec3 vTangent;
varying vec3 vBitangent;

uniform float poolDepth;
uniform float SURFACE_LEVEL;
uniform float tileRepeat;

vec3 WATER_COLOR = vec3(0.8, 1.0, 1.1);
float LIGHT_INTENSITY = 1.0;

void main() {
  vec3 color;
  vec3 look = normalize(vPosition - cameraPosition);
  vec3 refractedLook = refract(look, vNormal, 1.f / 1.33f);
  vec3 hit;

  vec3 tangent;
  vec3 bitangent;
  vec3 hitNormal;
  vec2 coords;

  /** ------------------------------------------------------------
   *  Refraction
   */
  // Hit on the bottom
  hit = vPosition + refractedLook * (-poolDepth - vPosition.y) / refractedLook.y;

  bitangent = vec3(0, 0, 1);
  tangent = vec3(1, 0, 0);
  hitNormal = vec3(0, 1, 0);
  coords = vec2(hit.x, hit.z) / tileRepeat;

  vec3 light = normalize(sun - hit);
  vec3 col = texture2D(tile, coords).rgb;
  vec3 nrm = normalize(texture2D(tileNrm, coords).rgb * 2.0 - 1.0);

  mat3 TBN = mat3(tangent, bitangent, hitNormal);
  vec3 normal = normalize(TBN * nrm.rgb);
  vec3 r = normalize(reflect(refractedLook, normal));

  float diff = clamp(LIGHT_INTENSITY * dot(normal, light), 0.0, 1.0);
  float spec = LIGHT_INTENSITY * pow(clamp(dot(light, r), 0.0, 1.0) , 1500.0);

  vec3 colRefraction = diff * col + spec;


  /** ------------------------------------------------------------
   *  Reflection
   */
  vec3 lightSurface = normalize(sun - vPosition);
  vec3 rSurface = normalize(reflect(look, vNormal));

  vec3 diffSurface = WATER_COLOR * abs(LIGHT_INTENSITY * dot(vNormal, lightSurface)); // abs for underwater
  float specSurface = LIGHT_INTENSITY * pow(clamp(dot(lightSurface, rSurface), 0.0, 1.0) , 1500.0);
  vec3 colReflection = diffSurface * 0.2 + specSurface * 10.0 * vec3(1);


  /** ------------------------------------------------------------
   *  Fresnel mix with F0 as 2%
   */
  float fresnel = mix(0.02, 1.0, pow(1.0 - dot(vNormal, -look), 3.0));
  color = mix(colRefraction,  colReflection, fresnel);

  gl_FragColor = vec4(color, 1);
}
