import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';

export class PostPipeline {
  public composer: EffectComposer;
  public bloomPass: UnrealBloomPass;
  public outputPass: OutputPass;
  private renderer: THREE.WebGLRenderer;

  constructor(renderer: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.PerspectiveCamera) {
    this.renderer = renderer;

    const size = new THREE.Vector2();
    renderer.getSize(size);

    this.composer = new EffectComposer(renderer);

    // 1. Scene Render Pass
    const renderPass = new RenderPass(scene, camera);
    this.composer.addPass(renderPass);

    // 2. Unreal Bloom Pass (Clean, crisp, gentle glow)
    this.bloomPass = new UnrealBloomPass(
      new THREE.Vector2(size.x, size.y),
      0.35, // Bloom Strength
      0.30, // Bloom Radius
      0.85  // Bloom Threshold
    );
    this.composer.addPass(this.bloomPass);

    // 3. Output Pass (sRGB & Tone Mapping to screen)
    this.outputPass = new OutputPass();
    this.composer.addPass(this.outputPass);
  }

  public setSize(width: number, height: number): void {
    this.composer.setSize(width, height);
    this.bloomPass.resolution.set(width, height);
  }

  public render(): void {
    this.composer.render();
  }

  public takePhoto(): void {
    this.composer.render();
    const dataUrl = this.renderer.domElement.toDataURL('image/png');
    const link = document.createElement('a');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    link.download = `Aetheria_Nature_${timestamp}.png`;
    link.href = dataUrl;
    link.click();
  }
}
