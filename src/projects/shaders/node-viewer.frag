varying vec3 vPosition;
varying vec2 vUv;

const int N_POINTS = 50;
uniform vec2[N_POINTS] points;
uniform int nPoints;

void main() {
  float dist = 1000.0;
  for(int i=0; i<nPoints; i++) {
    vec2 point = points[i];
    dist = min(dist, length(point - vPosition.xz));
  }

  vec3 color = vec3(dist);

  gl_FragColor = vec4(color, 1);
}

