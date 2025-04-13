import * as THREE from "three";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass";

const AlphaMixShader = {
  name: "AlphaMixShader",
  uniforms: {
    tDiffuse1: { value: null },
    tDiffuse2: { value: null },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse1;
    uniform sampler2D tDiffuse2;
    varying vec2 vUv;
    void main() {
      vec4 tex1 = texture2D(tDiffuse1, vUv);
      vec4 tex2 = texture2D(tDiffuse2, vUv);
      gl_FragColor = vec4(mix(tex1.rgb, tex2.rgb, tex2.a), 1.0);
    }
  `,
};

/**
 * Alpha mix using tDiffuse2's alpha channel
 */
export default class AlphaMixPass extends ShaderPass {
  constructor(tDiffuse1: THREE.Texture, tDiffuse2: THREE.Texture) {
    super(AlphaMixShader);
    this.uniforms["tDiffuse1"].value = tDiffuse1;
    this.uniforms["tDiffuse2"].value = tDiffuse2;
    this.needsSwap = true;
  }
}
