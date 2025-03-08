uniform sampler2D water;
uniform sampler2D tileCol;
uniform sampler2D tileNrm;
uniform sampler2D envMap;

uniform vec3 light;

varying vec3 vPosition;
varying vec3 vNormal;
varying vec3 vTangent;
varying vec3 vBitangent;

uniform float poolDepth;
uniform float SURFACE_LEVEL;
uniform float tileRepeat;

vec3 WATER_COLOR = vec3(0.8, 1.0, 1.1);
float LIGHT_INTENSITY = 1.0;

vec2 directionToEquirectangularUV(vec3 dir) {
    float u = atan(dir.z, dir.x) / (2.0 * 3.14159265) + 0.5;
    float v = asin(dir.y) / 3.14159265 + 0.5;
    return vec2(u, v);
}

vec3 getUnderWaterColor(vec3 pos, vec3 dir) {
  vec3 tangent;
  vec3 bitangent;
  vec3 hitNormal;
  vec2 coords;

  vec3 hit = pos + dir * (-poolDepth - pos.y) / dir.y;
  bitangent = vec3(0, 0, 1);
  tangent = vec3(1, 0, 0);
  hitNormal = vec3(0, 1, 0);
  coords = vec2(hit.x, hit.z) / tileRepeat;

  vec3 col = texture2D(tileCol, coords).rgb;
  vec3 nrm = normalize(texture2D(tileNrm, coords).rgb * 2.0 - 1.0);

  mat3 TBN = mat3(tangent, bitangent, hitNormal);
  vec3 normal = normalize(TBN * nrm.rgb);
  vec3 r = reflect(dir, normal);
  vec3 refractedLight = -refract(-light, vec3(0,1,0), IOR);

  float diff = clamp(LIGHT_INTENSITY * dot(normal, refractedLight), 0.0, 1.0);
  float spec = LIGHT_INTENSITY * pow(clamp(dot(refractedLight, r), 0.0, 1.0) , 1500.0);

  return diff * col + spec;
}

void main() {
  vec3 look = normalize(vPosition - cameraPosition);

  /* Refraction */
  vec3 refractedLook = refract(look, vNormal, IOR);
  vec3 colRefraction = getUnderWaterColor(vPosition, refractedLook);

  /* Reflection */
  vec3 colReflection;
  vec3 rSurface = reflect(look, vNormal);

  if (rSurface.y < 0.0) {
    colReflection = getUnderWaterColor(vPosition, refract(rSurface, vNormal, IOR));
  } else {
    vec3 diffSurface = WATER_COLOR * abs(LIGHT_INTENSITY * dot(vNormal, light)); // abs for underwater
    float specSurface = LIGHT_INTENSITY * pow(clamp(dot(light, rSurface), 0.0, 1.0) , 1500.0);
    vec2 uv = directionToEquirectangularUV(rSurface);
    vec3 env = texture2D(envMap, fract(uv)).rgb;
    colReflection = diffSurface * 0.2 + specSurface * 10.0 + env;
  }

  /* Fresnel mix with F0 as 2% */
  float fresnel = mix(0.02, 1.0, pow(1.0 - dot(vNormal, -look), 3.0));
  vec3 color = mix(colRefraction,  colReflection, fresnel);

  gl_FragColor = vec4(color, 1);
}
