import * as THREE from "three";

import config from "~/config";

const uniforms = {
  nPoints: { value: 0 },
  points: {
    value: Array(config.MAX_POINTS).fill(
      new THREE.Vector2(),
    ) as THREE.Vector2[],
  },
  poolDepth: { value: config.POOL_DEPTH },
  surfaceY: { value: config.SURFACE_Y },
  poolSize: { value: config.POOL_SIZE },
  isPoolValid: { value: true },

  light: { value: new THREE.Vector3(...config.SUN_POS).normalize() },
  lightIntensity: { value: 3 },

  water: { value: null as THREE.Texture | null },
  causticsTex: { value: null as THREE.Texture | null },

  tileCol: { value: null as THREE.Texture | null },
  tileNrm: { value: null as THREE.Texture | null },
  tileRepeat: { value: config.TILE_REPEAT },

  copingCol: { value: null as THREE.Texture | null },
  copingNrm: { value: null as THREE.Texture | null },
  copingRepeat: { value: config.COPING_REPEAT },

  worldCol: { value: null as THREE.Texture | null },
  worldNrm: { value: null as THREE.Texture | null },
  worldSize: { value: config.WORLD_SIZE },
  worldRepeat: { value: config.WORLD_REPEAT },

  envMap: { value: null as THREE.Texture | null },
} satisfies THREE.ShaderMaterial["uniforms"];

export default uniforms;
