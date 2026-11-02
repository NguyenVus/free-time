import { SoundEngine } from '../audio/SoundEngine.ts';
import { CameraMode, CinematicCamera } from '../controls/CinematicCamera.ts';
import { PostPipeline } from '../postprocessing/PostPipeline.ts';

export class UIOverlay {
  private soundEngine: SoundEngine;
  private cameraSystem: CinematicCamera;
  private postPipeline: PostPipeline;

  private uiLayer: HTMLElement;
  private timeSlider: HTMLInputElement;
  private timeVal: HTMLElement;
  private windSlider: HTMLInputElement;
  private windVal: HTMLElement;
  private fpsDisplay: HTMLElement;
  private audioBtn: HTMLElement;
  private audioText: HTMLElement;
  private cameraBtn: HTMLElement;
  private cameraText: HTMLElement;
  private meditationBtn: HTMLElement;
  private photoBtn: HTMLElement;
  private photoFrame: HTMLElement;
  private gardenBtn: HTMLElement;
  private shrinesCount: HTMLElement;
  private toastElem: HTMLElement;
  private discoveryBanner: HTMLElement;
  private discoveryTitle: HTMLElement;
  private discoveryDesc: HTMLElement;
  private clickToPlayHint: HTMLElement;

  private isPhotoMode = false;
  private isUiVisible = true;

  public onTimeChange?: (time: number) => void;
  public onWindChange?: (wind: number) => void;
  public onMoodChange?: (mood: 'dawn' | 'noon' | 'sunset' | 'aurora' | 'rain') => void;
  public onTeleportToGarden?: () => void;

  constructor(soundEngine: SoundEngine, cameraSystem: CinematicCamera, postPipeline: PostPipeline) {
    this.soundEngine = soundEngine;
    this.cameraSystem = cameraSystem;
    this.postPipeline = postPipeline;

    this.uiLayer = document.getElementById('ui-layer')!;
    this.timeSlider = document.getElementById('time-slider') as HTMLInputElement;
    this.timeVal = document.getElementById('time-val')!;
    this.windSlider = document.getElementById('wind-slider') as HTMLInputElement;
    this.windVal = document.getElementById('wind-val')!;
    this.fpsDisplay = document.getElementById('fps-display')!;
    this.audioBtn = document.getElementById('audio-toggle-btn')!;
    this.audioText = document.getElementById('audio-btn-text')!;
    this.cameraBtn = document.getElementById('camera-mode-btn')!;
    this.cameraText = document.getElementById('camera-mode-text')!;
    this.meditationBtn = document.getElementById('meditation-btn')!;
    this.photoBtn = document.getElementById('photo-mode-btn')!;
    this.photoFrame = document.getElementById('photo-frame')!;
    this.gardenBtn = document.getElementById('garden-teleport-btn')!;
    this.shrinesCount = document.getElementById('shrines-count')!;
    this.toastElem = document.getElementById('toast')!;
    this.discoveryBanner = document.getElementById('discovery-banner')!;
    this.discoveryTitle = document.getElementById('discovery-title')!;
    this.discoveryDesc = document.getElementById('discovery-desc')!;
    this.clickToPlayHint = document.getElementById('click-to-play-hint')!;

    this.setupListeners();
  }

  private setupListeners(): void {
    // Time slider
    this.timeSlider.addEventListener('input', () => {
      const val = parseFloat(this.timeSlider.value);
      this.updateTimeDisplay(val);
      if (this.onTimeChange) this.onTimeChange(val);
    });

    // Wind slider
    this.windSlider.addEventListener('input', () => {
      const val = parseFloat(this.windSlider.value);
      this.windVal.textContent = val < 0.8 ? 'Nhẹ' : val < 1.6 ? 'Vừa' : 'Mạnh';
      if (this.onWindChange) this.onWindChange(val);
    });

    // Mood preset buttons
    const moodBtns = document.querySelectorAll<HTMLButtonElement>('.mood-btn');
    moodBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        moodBtns.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        const mood = btn.dataset.mood as 'dawn' | 'noon' | 'sunset' | 'aurora' | 'rain';
        if (this.onMoodChange) this.onMoodChange(mood);
      });
    });

    // Audio toggle
    this.audioBtn.addEventListener('click', () => {
      const active = this.soundEngine.toggle();
      this.audioText.textContent = active ? 'Âm thanh: BẬT' : 'Âm thanh: TẮT';
      if (active) {
        this.audioBtn.classList.add('audio-playing');
        this.showToast('🎵 Đã kích hoạt hệ thống âm thanh thiên nhiên!');
      } else {
        this.audioBtn.classList.remove('audio-playing');
        this.showToast('🔇 Đã tắt âm thanh');
      }
    });

    // Garden Teleport Button
    this.gardenBtn.addEventListener('click', () => {
      if (this.onTeleportToGarden) {
        this.onTeleportToGarden();
        this.showToast('🌸 Đã đưa bạn đến trung tâm Vườn Hoa Anh Đào!');
      }
    });

    // Camera Mode Toggle (Walk FPS vs Drone)
    this.cameraBtn.addEventListener('click', () => {
      if (this.cameraSystem.mode === 'walk') {
        this.cameraSystem.setMode('drone');
        this.cameraText.textContent = 'Góc Bay Tự Do (Drone)';
        this.cameraBtn.classList.add('active');
        this.clickToPlayHint.style.display = 'none';
        this.showToast('🚀 Chuyển sang Chế Độ Bay Drone (WASD + Space/Shift)');
      } else {
        this.cameraSystem.setMode('walk');
        this.cameraText.textContent = 'Góc Đi Bộ (FPS)';
        this.cameraBtn.classList.remove('active');
        this.showToast('🚶 Chuyển sang Chế Độ Đi Bộ Trên Mặt Đất');
      }
    });

    // Zen Meditation Mode Toggle
    this.meditationBtn.addEventListener('click', () => {
      if (this.cameraSystem.mode !== 'meditation') {
        this.cameraSystem.setMode('meditation');
        this.meditationBtn.classList.add('active');
        this.clickToPlayHint.style.display = 'none';
        this.showToast('🧘 Chế độ Thiền Định Ngắm Cảnh: Thư giãn cùng thiên nhiên');
      } else {
        this.cameraSystem.setMode('walk');
        this.meditationBtn.classList.remove('active');
        this.cameraText.textContent = 'Góc Đi Bộ (FPS)';
      }
    });

    // Photo Mode Button
    this.photoBtn.addEventListener('click', () => {
      this.isPhotoMode = !this.isPhotoMode;
      if (this.isPhotoMode) {
        this.photoFrame.classList.add('active');
        this.photoBtn.classList.add('active');
        this.showToast('📷 Đã bật Khung Ảnh Nghệ Thuật! Nhấp lần nữa để lưu ảnh 4K');
      } else {
        this.photoFrame.classList.remove('active');
        this.photoBtn.classList.remove('active');
        this.postPipeline.takePhoto();
        this.showToast('✨ Đã chụp và lưu ảnh phong cảnh tuyệt đẹp về máy!');
      }
    });

    // Global Key shortcuts
    window.addEventListener('keydown', (e) => {
      // 'U' toggles UI visibility for pure scenery enjoyment
      if (e.code === 'KeyU') {
        this.isUiVisible = !this.isUiVisible;
        if (this.isUiVisible) {
          this.uiLayer.classList.remove('ui-hidden');
        } else {
          this.uiLayer.classList.add('ui-hidden');
        }
      }

      // 'C' cycles camera mode
      if (e.code === 'KeyC') {
        this.cameraBtn.click();
      }

      // 'M' toggles meditation mode
      if (e.code === 'KeyM') {
        this.meditationBtn.click();
      }

      // 'P' takes photo
      if (e.code === 'KeyP') {
        this.photoBtn.click();
      }
    });

    // Hide click hint once pointer locked
    document.addEventListener('pointerlockchange', () => {
      if (document.pointerLockElement) {
        this.clickToPlayHint.style.display = 'none';
        if (!this.soundEngine.active) {
          this.audioBtn.click(); // Autoplay natural audio on first click
        }
      }
    });
  }

  public updateTimeDisplay(val: number): void {
    const hours = Math.floor(val);
    const mins = Math.floor((val - hours) * 60);
    this.timeVal.textContent = `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
    this.timeSlider.value = val.toString();
  }

  public updateFps(fps: number): void {
    this.fpsDisplay.textContent = `${Math.round(fps)} FPS`;
  }

  public showToast(msg: string): void {
    this.toastElem.textContent = msg;
    this.toastElem.classList.add('show');
    setTimeout(() => {
      this.toastElem.classList.remove('show');
    }, 3200);
  }

  public notifyShrineDiscovered(name: string, count: number): void {
    this.shrinesCount.textContent = `${count} / 5`;
    this.discoveryTitle.textContent = `✨ Khám Phá: ${name}`;
    this.discoveryDesc.textContent = `Bạn đã thắp sáng ngọn hải đăng tâm linh (${count}/5 di tích cổ)!`;
    this.discoveryBanner.classList.add('show');
    setTimeout(() => {
      this.discoveryBanner.classList.remove('show');
    }, 4500);
  }
}
