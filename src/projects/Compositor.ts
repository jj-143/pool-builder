import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass";

import App from "@core/App";
import type Project from "@core/Project";

export interface Compositor {
  init(): void;
  setSize(width: number, height: number): void;
  render(): void;
}

/**
 * Compositor - Manages render passes, postfx, tonemapping, etc
 */
export default class MainCompositor implements Compositor {
  private project: Project;
  private renderComposer: EffectComposer;

  private renderPass: RenderPass;
  private bloomPass: UnrealBloomPass;

  private params = {
    bloom: {
      threshold: 3.0,
      strength: 0.13,
      radius: 0.05,
    },
    exposure: 1.0,
  };

  constructor(project: Project) {
    this.project = project;
    const size = new THREE.Vector2();
    App.renderer.getDrawingBufferSize(size);

    const renderTarget = new THREE.WebGLRenderTarget(size.width, size.height, {
      stencilBuffer: true,
      type: THREE.HalfFloatType,
      samples: 4,
    });

    this.renderComposer = new EffectComposer(App.renderer, renderTarget);
    this.renderPass = new RenderPass(this.project.scene, this.project.camera);
    this.bloomPass = new UnrealBloomPass(
      new THREE.Vector2(...App.containerSize),
      this.params.bloom.strength,
      this.params.bloom.radius,
      this.params.bloom.threshold,
    );
  }

  init() {
    App.renderer.toneMappingExposure = this.params.exposure;
    App.renderer.toneMapping = THREE.NeutralToneMapping;

    this.renderComposer.addPass(this.renderPass);
    this.renderComposer.addPass(this.bloomPass);
    this.renderComposer.addPass(new OutputPass());
  }

  setSize(width: number, height: number) {
    this.renderComposer?.setSize(width, height);
  }

  render() {
    this.renderComposer?.render();
  }
}
