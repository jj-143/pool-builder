import * as THREE from "three";

import { config } from "~/config";

export const uniforms = {
  nPoints: { value: 0 },
  points: {
    value: Array(config.MAX_POINTS).fill(new THREE.Vector2()),
  },
} satisfies THREE.ShaderMaterial["uniforms"];
