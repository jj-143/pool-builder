uniform sampler2D water;
uniform sampler2D causticsTex;

uniform sampler2D tileCol;
uniform sampler2D tileNrm;
uniform sampler2D envMap;

uniform vec3 light;
uniform float lightIntensity;

varying vec3 vPosition;
varying vec3 vTangent;
varying vec3 vBitangent;

uniform float poolSize;
uniform float poolDepth;
uniform float surfaceY;
uniform float tileRepeat;

const float PI = 3.14159265;
const float INV_PI = 1.0 / 3.14159265;

float AMBIENT = 0.4;

// Modified Blinn-Phong
const float r_d = 0.99;      // For floor tile
const float r_s = 1.0 - r_d; // For floor tile
const float n_s = 20000.0;   // Tile & Water surface, very low roughness

// Normalization factor for specular, for large n_s
const float N = (n_s + 6.0) / (8.0 * PI); 

vec2 directionToEquirectangularUV(vec3 dir) {
    float u = atan(dir.z, dir.x) / (2.0 * 3.14159265) + 0.5;
    float v = asin(dir.y) / 3.14159265 + 0.5;
    return vec2(u, v);
}

float getShadow(vec3 pos, vec3 lightDir) {
  float t;
  if (intersectPool(pos + lightDir * 1e-3, lightDir, t) < 0) return 0.0;
  vec3 hit = pos + lightDir * t;

  /*
  * Smooth out the edges for soft-shadows using sigmoid.
  * tanh also works fine.
  *
  * For hard-shadows:
  * return hit.y > 0.0 ? 1.0 : 0.0;
  */
  float bias = 4.0 / 48.0; // small bias to hide jagged stencil edges
  hit.y -= bias;

  float dy = hit.y + bias;
  float denom = 1.0 + 10.0 * length(hit - pos); // smoothness from depth

  return 1.0 / (1.0 + exp(-400.0 * dy / denom));
}

vec3 getUnderWaterColor(vec3 pos, vec3 dir, float Li) {
  float t;
  int index = intersectPool(pos, dir, t);
  if (index < 0) discard;
  vec3 hit = pos + dir * t;

  vec3 tangent;
  vec3 bitangent;
  vec3 hitNormal;
  vec2 coords;

  if (hit.y < -poolDepth) {
    hit = pos + dir * (-poolDepth - pos.y) / dir.y;
    bitangent = vec3(0, 0, 1);
    tangent = vec3(1, 0, 0);
    hitNormal = vec3(0, 1, 0);
    coords = vec2(hit.x, hit.z) / tileRepeat;
  } else {
    vec3 segment[2] = vec3[](vec3(points[index], 0), vec3(points [(index+1) % nPoints], 0));
    tangent = -normalize(segment[1].xzy - segment[0].xzy);
    bitangent = vec3(0, 1, 0);
    hitNormal = normalize(cross(tangent, bitangent)); // to set right side of tangent as normal;
    vec2 computedCoord = vec2(length(segment[1].xy - hit.xz), hit.y);
    coords = computedCoord / tileRepeat;
  }

  /* Face color */
  vec3 col = texture2D(tileCol, coords).rgb;
  vec3 nrm = normalize(texture2D(tileNrm, coords).rgb * 2.0 - 1.0);

  mat3 TBN = mat3(tangent, bitangent, hitNormal);
  vec3 normal = normalize(TBN * nrm.rgb);
  vec3 refractedLight = -refract(-light, vec3(0,1,0), IOR);
  vec3 halfway = normalize(-dir + refractedLight);

  float NoL = clamp(dot(normal, refractedLight), 0.0, 1.0);
  float NoH = clamp(dot(normal, halfway), 0.0, 1.0);

  // Modified Blinn-Phong
  vec3 diff = r_d * INV_PI * col;
  float spec = r_s * N * pow(NoH , n_s);

  /* Caustics */
  vec2 surfaceCoord = (
    hit.xz + (surfaceY - hit.y) * refractedLight.xz / refractedLight.y
  ) * 0.5 + 0.5;
  float caustics = texture2D(causticsTex, surfaceCoord).r;
  caustics = min(.2 + 0.5 * caustics, 50.0);

  /* Shadow */
  float shadow = getShadow(hit, refractedLight);

  return AMBIENT * col + Li * NoL * (diff + spec) * caustics * shadow;
}

vec3 getSkyAmbient(vec3 lightDir) {
  vec2 uv = directionToEquirectangularUV(-lightDir);
  vec3 env = texture2D(envMap, fract(uv)).rgb;
  return env;
}

void main() {
  vec3 position = vPosition;
  vec4 info = texture2D(water, position.xz / poolSize + 0.5);
  position.y += info.r;
  vec3 normal = normalize(vec3(info.b, sqrt(1.0 - dot(info.ba, info.ba)), info.a)).xyz;

  vec3 look = normalize(position - cameraPosition);
  float NoL = clamp(dot(normal, light), 0.0, 1.0);
  float LiTransmission = NoL * lightIntensity;

  /* Refraction */
  vec3 refractedLook = refract(look, normal, IOR);
  vec3 colRefraction = getUnderWaterColor(position, refractedLook, LiTransmission);

  /* Reflection */
  vec3 colReflection;
  vec3 rSurface = reflect(look, normal);

  if (rSurface.y < 0.0) {
    colReflection = getUnderWaterColor(position, refract(rSurface, normal, IOR), LiTransmission);
  } else {
    vec3 halfway = normalize(-look + light);
    float NoH = clamp(dot(normal, halfway), 0.0, 1.0);
    float spec = N * pow(NoH , n_s);

    vec2 uv = directionToEquirectangularUV(rSurface);
    vec3 env = texture2D(envMap, fract(uv)).rgb;

    colReflection = lightIntensity * spec * NoL + env;
  }

  /* Fresnel mix with F0 as 2% */
  float fresnel = mix(0.02, 1.0, pow(1.0 - dot(normal, -look), 5.0));
  vec3 color = mix(colRefraction,  colReflection, fresnel);

  gl_FragColor = vec4(color, 1);
}
