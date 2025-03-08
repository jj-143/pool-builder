varying vec3 vOldPos;
varying vec3 vNewPos;

void main() {
  float oldArea = length(dFdx(vOldPos)) * length(dFdy(vOldPos));
  float newArea = length(dFdx(vNewPos)) * length(dFdy(vNewPos));
  float causticsIntensity = 1.0;

  if (newArea == 0.0) {
    // Arbitrary large value
    causticsIntensity = 2.0e+20;
  } else {
    causticsIntensity = oldArea / newArea;
  }

  gl_FragColor = vec4(causticsIntensity, 0, 0, 1);
}
