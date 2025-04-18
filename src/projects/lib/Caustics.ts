import * as THREE from "three";

import App from "@core/App";

import config from "~/config";
import uniforms from "~/uniforms";

import causticsFrag from "~/shaders/caustics.frag?raw";
import causticsVert from "~/shaders/caustics.vert?raw";
import intersectPool from "~/shaders/intersectPool.glsl?raw";

const TEXTURE_SIZE = 1024;

export default class Caustics {
  renderTarget: THREE.WebGLRenderTarget;
  camera: THREE.Camera;
  mesh: THREE.Mesh;

  constructor() {
    this.renderTarget = new THREE.WebGLRenderTarget(
      TEXTURE_SIZE,
      TEXTURE_SIZE,
      {
        type: THREE.HalfFloatType,
      },
    );
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 3);
    this.mesh = createMesh();
    uniforms["causticsTex"].value = this.renderTarget.texture;
  }

  render() {
    const oldTarget = App.renderer.getRenderTarget();
    App.renderer.setRenderTarget(this.renderTarget);
    App.renderer.clear();
    App.renderer.render(this.mesh, this.camera);
    App.renderer.setRenderTarget(oldTarget);
  }
}

function createMesh(): THREE.Mesh {
  const geometry = new THREE.PlaneGeometry(2, 2, 200, 200);
  const mat = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: intersectPool + causticsVert,
    fragmentShader: causticsFrag,
    defines: config.DEFINES,
  });

  return new THREE.Mesh(geometry, mat);
}
