uniform sampler2D water;
uniform vec3 light;
uniform float poolDepth;
uniform float surfaceY;

varying vec3 vOldPos;
varying vec3 vNewPos;

/**
 * Return the projection point on the XZ Plane y=Y
 */
vec3 projectXZ(vec3 origin, vec3 dir, float Y) {
  return origin + dir * (Y - origin.y) / dir.y;
}

void main() {
  vec3 modelPos = vec3(position.x, surfaceY, position.y);
  vec2 texCoord = position.xy * 0.5 + 0.5;
  vec3 pos = modelPos;

  vec4 info = texture2D(water, texCoord);
  info.ba *= 0.5; // Soften the caustics
  vec3 normal = normalize(vec3(info.b, sqrt(1.0 - dot(info.ba, info.ba)), info.a));
  pos.y += info.r;

  /* Find the light-wall intersection */
  float t;
  vec3 refracted = refract(-light, normal, IOR);
  vec3 refractedLight = refract(-light, vec3(0, 1, 0), IOR);

  /* No intersection */
  if (intersectPool(pos, refracted, t) < 0) {
    vOldPos = modelPos;
    vNewPos = modelPos;
    gl_Position = vec4(modelPos.xz, 0, 1);return;
  } 

  /* Intersection: wall or floor */
  vec3 hit = pos + refracted * t;

  if (hit.y > -poolDepth) {
    vNewPos = projectXZ(hit, refractedLight, -poolDepth);
  } else {
    vNewPos = projectXZ(pos, refracted, -poolDepth);
  }

  vOldPos = projectXZ(modelPos, refractedLight, -poolDepth);
  vec2 screenPos = projectXZ(vNewPos, refractedLight, surfaceY).xz;
  gl_Position = vec4(screenPos, 0, 1);
}
