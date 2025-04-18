import {
  BloomEffect,
  BloomEffectOptions,
  ClearPass,
  CopyPass,
  EffectComposer,
  EffectPass,
  FXAAEffect,
  RenderPass,
  ToneMappingEffect,
  ToneMappingMode,
} from "postprocessing";
import * as THREE from "three";

import App from "@core/App";
import type Project from "@core/Project";

import config, { layers } from "~/config";
import uniforms from "~/uniforms";

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
  private renderAAComposer: EffectComposer;
  private finalComposer: EffectComposer;

  private params = {
    bloom: {
      luminanceThreshold: 5,
      luminanceSmoothing: 50,
      mipmapBlur: true,
      intensity: 0.12,
      radius: 0.7,
      levels: 4,
    } satisfies BloomEffectOptions,
    exposure: 1.0,
  };

  constructor(project: Project) {
    this.project = project;

    // Render layer - layers.DEFAULT (scene & background)
    this.renderComposer = new EffectComposer(App.renderer, {
      frameBufferType: THREE.HalfFloatType,
      stencilBuffer: true,
    });
    this.renderComposer.autoRenderToScreen = false;

    // Render layer - layers.AA (Coping only)
    this.renderAAComposer = new EffectComposer(App.renderer, {
      frameBufferType: THREE.HalfFloatType,
      multisampling: config.AA == "MSAA" ? 4 : 0,
    });
    this.renderAAComposer.autoRenderToScreen = false;

    // Final composer - mix & postfx
    this.finalComposer = new EffectComposer(App.renderer, {
      frameBufferType: THREE.HalfFloatType,
      depthBuffer: false,
    });
  }

  init() {
    App.renderer.toneMappingExposure = this.params.exposure;
    App.renderer.toneMapping = THREE.NoToneMapping;

    // ----------------------------------------------------------------------
    // Passes
    const render = new RenderPass(this.project.scene, this.project.camera);

    // Alpha blend render passes
    const copyToFinal = new CopyPass(this.finalComposer.inputBuffer);
    const alphaBlendToFinal = new CopyPass(this.finalComposer.inputBuffer);
    alphaBlendToFinal.fullscreenMaterial.blending = THREE.CustomBlending;

    // Post
    const effects = new EffectPass(
      this.project.camera,
      new BloomEffect(this.params.bloom),
      new ToneMappingEffect({ mode: ToneMappingMode.NEUTRAL }),
    );

    // ----------------------------------------------------------------------
    // Build graph

    // Render pass - layers.DEFAULT
    this.renderComposer.addPass(render);
    this.renderComposer.addPass(new ClearPass(false, false, true)); // Stencil

    // Render pass - layers.AA
    this.renderAAComposer.addPass(render);
    if (config.AA == "FXAA") {
      const effect = new FXAAEffect();
      const fxaa = new EffectPass(this.project.camera, effect);
      this.renderAAComposer.addPass(fxaa);
    }

    // Final (post, tonemapping)
    this.renderComposer.addPass(copyToFinal);
    this.renderAAComposer.addPass(alphaBlendToFinal);
    this.finalComposer.addPass(effects);
  }

  setSize(width: number, height: number) {
    this.renderComposer.setSize(width, height);
    this.renderAAComposer.setSize(width, height);
    this.finalComposer.setSize(width, height);
  }

  render() {
    // Render pass - layers.DEFAULT
    this.project.scene.background = uniforms["envMap"].value;
    this.project.camera.layers.set(layers.DEFAULT);
    this.renderComposer.render();

    // Render pass - layers.AA
    this.project.scene.background = null;
    this.project.camera.layers.set(layers.AA);
    this.renderAAComposer.render();

    // Mix, post, tonemapping
    this.finalComposer.render();
  }
}
