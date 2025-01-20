import * as THREE from "three";

import { config } from "~/config";

export const uniforms = {
  nPoints: { value: 0 },
  points: {
    value: Array(config.MAX_POINTS).fill(new THREE.Vector2()),
  },
  poolDepth: { value: config.POOL_DEPTH },
  surfaceY: { value: config.SURFACE_Y },

  sun: { value: new THREE.Vector3(0.5, 1, 0.5) },

  tile: { value: null as THREE.Texture | null },
  tileNrm: { value: null as THREE.Texture | null },
  tileRepeat: { value: config.TILE_REPEAT },
} satisfies THREE.ShaderMaterial["uniforms"];
