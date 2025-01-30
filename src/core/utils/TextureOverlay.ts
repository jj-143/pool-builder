import * as THREE from "three";

import App from "@core/App";

export default class TextureOverlay {
  // Dimensions
  scale = 300;
  gap = 10;

  private camera = new THREE.OrthographicCamera(-0.5, 0.5, 0.5, -0.5, 0, 1);
  private sprites: THREE.Sprite[] = [];

  constructor(...textures: THREE.Texture[]) {
    this.init();
    if (textures) this.add(...textures);
  }

  add(...textures: THREE.Texture[]) {
    textures.forEach((texture) => {
      const spriteMaterial = new THREE.SpriteMaterial({
        map: texture,
        transparent: false,
      });
      this.sprites.push(new THREE.Sprite(spriteMaterial));
    });

    this.updateDimensions();
  }

  render() {
    App.renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
    this.sprites.forEach((sprite) => {
      App.renderer.render(sprite, this.camera);
    });
    App.renderer.outputColorSpace = THREE.SRGBColorSpace;
  }

  updateDimensions() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    this.camera.left = -width / 2;
    this.camera.right = width / 2;
    this.camera.top = height / 2;
    this.camera.bottom = -height / 2;
    this.camera.updateProjectionMatrix();

    this.sprites.forEach((sprite, idx) => {
      const x = -width / 2 + this.scale / 2;
      const y = height / 2 - this.scale / 2 - idx * this.scale - idx * this.gap;
      sprite.position.set(x, y, 1);
      sprite.scale.set(this.scale, this.scale, 1);
    });
  }

  private init() {
    this.camera.position.set(0, 0, 1);
    this.updateDimensions();
    window.addEventListener("resize", this.updateDimensions.bind(this));
  }
}
