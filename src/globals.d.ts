// three.js r128 is loaded from a CDN script tag in index.html, so THREE is a global at runtime and
// @types/three only provides its types (see "allowUmdGlobalAccess" in tsconfig.json).

interface Window {
  cherrySanctuaryApp: unknown;
  webkitAudioContext: typeof AudioContext;
}

interface Navigator {
  /** iOS Safari: true when opened from the Home Screen. */
  standalone?: boolean;
}

interface Document {
  webkitFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => Promise<void>;
}

interface HTMLElement {
  webkitRequestFullscreen?: () => Promise<void>;
}
