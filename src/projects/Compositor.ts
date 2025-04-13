import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass";

import App from "@core/App";
import type Project from "@core/Project";

import { layers } from "~/config";
import AlphaMixPass from "~/lib/AlphaMixPass";
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
      threshold: 3.0,
      strength: 0.13,
      radius: 0.05,
    },
    exposure: 1.0,
  };

  constructor(project: Project) {
    this.project = project;

    // Render layer - layers.DEFAULT (scene & background)
    const target0 = new THREE.WebGLRenderTarget(0, 0, {
      type: THREE.HalfFloatType,
      stencilBuffer: true,
    });
    this.renderComposer = new EffectComposer(App.renderer, target0);
    this.renderComposer.renderToScreen = false;

    // Render layer - layers.AA (Coping only)
    const targetAA = new THREE.WebGLRenderTarget(0, 0, {
      type: THREE.HalfFloatType,
      samples: 4,
    });
    this.renderAAComposer = new EffectComposer(App.renderer, targetAA);
    this.renderAAComposer.renderToScreen = false;

    // Final composer - mix & postfx
    const finalTarget = new THREE.WebGLRenderTarget(0, 0, {
      type: THREE.HalfFloatType,
    });
    this.finalComposer = new EffectComposer(App.renderer, finalTarget);
  }

  init() {
    App.renderer.toneMappingExposure = this.params.exposure;
    App.renderer.toneMapping = THREE.NeutralToneMapping;

    // ----------------------------------------------------------------------
    // Passes
    const render = new RenderPass(this.project.scene, this.project.camera);

    const alphaMix = new AlphaMixPass(
      this.renderComposer.renderTarget2.texture,
      this.renderAAComposer.renderTarget2.texture,
    );

    const bloom = new UnrealBloomPass(
      new THREE.Vector2(...App.containerSize),
      this.params.bloom.strength,
      this.params.bloom.radius,
      this.params.bloom.threshold,
    );

    const output = new OutputPass();

    // ----------------------------------------------------------------------
    // Build graph
    this.renderComposer.addPass(render);
    this.renderAAComposer.addPass(render);
    this.finalComposer.addPass(alphaMix);
    this.finalComposer.addPass(bloom);
    this.finalComposer.addPass(output);
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

    // Mix, Post, Tonemapping
    this.finalComposer.render();
  }
}
