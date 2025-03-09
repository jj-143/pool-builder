import * as THREE from "three";

import App from "@core/App";

import config from "~/config";
import uniforms from "~/uniforms";

import dropWaterShader from "./dropWater.frag?raw";
import updateShader from "./update.frag?raw";
import updateNormalShader from "./updateNormal.frag?raw";
import vertexShader from "./vertex.vert?raw";

const TEXTURE_SIZE = 256;
const DELTA = 1 / 256;

export default class WaterSimulation {
  step = 0;
  target: THREE.WebGLRenderTarget;
  stencil?: THREE.Mesh;

  private uniforms = {
    delta: { value: [DELTA, DELTA] },
    center: { value: [0, 0] },
    radius: { value: 0 },
    strength: { value: 0 },
    water: uniforms["water"],
  } satisfies THREE.ShaderMaterial["uniforms"];
  private camera: THREE.OrthographicCamera;
  private geometry: THREE.BufferGeometry;
  private targetA: THREE.WebGLRenderTarget;
  private targetB: THREE.WebGLRenderTarget;
  private dropMesh: THREE.Mesh;
  private updateMesh: THREE.Mesh;
  private updateNormalMesh: THREE.Mesh;

  constructor() {
    const w = config.POOL_SIZE / 2; // 1:1 match for Pool & stencil

    // Looking from below to align the stencil mesh with camera space (xy plane)
    this.camera = new THREE.OrthographicCamera(-w, w, w, -w, 0, 100);
    this.camera.rotateX(Math.PI / 2);
    this.geometry = new THREE.PlaneGeometry(2, 2);

    this.targetA = new THREE.WebGLRenderTarget(TEXTURE_SIZE, TEXTURE_SIZE, {
      type: THREE.FloatType,
      stencilBuffer: true,
    });
    this.targetB = new THREE.WebGLRenderTarget(TEXTURE_SIZE, TEXTURE_SIZE, {
      type: THREE.FloatType,
      stencilBuffer: true,
    });
    this.target = this.targetA;

    // Init Shaders
    const dropMaterial = new THREE.ShaderMaterial({
      vertexShader: vertexShader,
      fragmentShader: dropWaterShader,
      uniforms: this.uniforms,
      stencilRef: 1,
      stencilWrite: true,
      stencilFunc: THREE.EqualStencilFunc,
    });

    const updateMaterial = new THREE.ShaderMaterial({
      vertexShader: vertexShader,
      fragmentShader: updateShader,
      uniforms: this.uniforms,
      stencilRef: 1,
      stencilWrite: true,
      stencilFunc: THREE.EqualStencilFunc,
    });

    const updateNormalMaterial = new THREE.ShaderMaterial({
      vertexShader: vertexShader,
      fragmentShader: updateNormalShader,
      uniforms: this.uniforms,
      stencilRef: 1,
      stencilWrite: true,
      stencilFunc: THREE.EqualStencilFunc,
    });

    this.dropMesh = new THREE.Mesh(this.geometry, dropMaterial);
    this.updateMesh = new THREE.Mesh(this.geometry, updateMaterial);
    this.updateNormalMesh = new THREE.Mesh(this.geometry, updateNormalMaterial);
  }

  // Add a drop of water at the (x, y) coordinate (in the range [-1, 1])
  addDrop(x: number, y: number, radius: number, strength: number) {
    this.uniforms["center"].value = [x, y];
    this.uniforms["radius"].value = radius;
    this.uniforms["strength"].value = strength;

    this.render(this.dropMesh);
    if (App.instance.animationState === "stop") {
      this.render(this.updateNormalMesh);
    }
  }

  stepSimulation() {
    this.step++;
    this.render(this.updateMesh);
    this.render(this.updateNormalMesh);
  }

  updateNormal() {
    this.render(this.updateNormalMesh);
  }

  private render(mesh: THREE.Mesh) {
    // Swap textures
    const _oldTarget = this.target;
    const _newTarget =
      this.target === this.targetA ? this.targetB : this.targetA;

    const oldTarget = App.renderer.getRenderTarget();

    App.renderer.setRenderTarget(_newTarget);
    App.renderer.setClearAlpha(0);
    App.renderer.clear();

    this.uniforms["water"].value = _oldTarget.texture;

    if (this.stencil) {
      // TODO: If no stencil, should it
      // Stencil always there, full square if there's no point.
      // So isn't this.stencil always exist??
      App.renderer.render(this.stencil, this.camera);
    }
    App.renderer.render(mesh, this.camera);
    App.renderer.setRenderTarget(oldTarget);
    this.target = _newTarget;
    this.uniforms["water"].value = _newTarget.texture;
  }
}
