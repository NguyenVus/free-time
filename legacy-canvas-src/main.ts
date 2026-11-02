/**
 * main.ts
 * Main entry point for Vườn Anh Đào (Sakura Sanctuary).
 * Orchestrates the procedural Canvas 2D engine, Web Audio API soundscape,
 * and user interactions.
 */

import { GardenSoundEngine } from './audio/GardenSoundEngine.ts';
import { PetalSystem } from './garden/PetalSystem.ts';
import { GardenRenderer } from './garden/GardenRenderer.ts';
import { GardenUI } from './ui/GardenUI.ts';

class GardenApp {
  private petalSystem: PetalSystem;
  private renderer: GardenRenderer;
  private soundEngine: GardenSoundEngine;
  private ui: GardenUI;

  constructor() {
    const canvas = document.getElementById('garden-canvas') as HTMLCanvasElement;
    if (!canvas) {
      throw new Error('Canvas element #garden-canvas not found.');
    }

    // 1. Initialize Petal simulation
    this.petalSystem = new PetalSystem();

    // 2. Initialize Master Canvas 2D Scenic Renderer
    this.renderer = new GardenRenderer(canvas, this.petalSystem);

    // 3. Initialize Procedural Web Audio API Sound Engine
    this.soundEngine = new GardenSoundEngine();

    // 4. Initialize User Interface & Interactions
    this.ui = new GardenUI(this.soundEngine, this.renderer, this.petalSystem);

    // 5. Start Animation Loop
    this.startLoop();
  }

  private startLoop(): void {
    const animate = (timestamp: number) => {
      this.renderer.render(timestamp);
      requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }
}

// Bootstrap on DOM ready
window.addEventListener('DOMContentLoaded', () => {
  new GardenApp();
});
