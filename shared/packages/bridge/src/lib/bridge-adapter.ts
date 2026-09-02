/**
 * The Capacitor bridge adapter.
 *
 * This is the single integration surface for native (Capacitor) capabilities.
 * Micro-frontends and the shell import from `@jrumandal/bridge` — never from
 * `@capacitor/*` directly — so that:
 *
 *  1. Native calls are isolated in one place (easy to swap / mock / test).
 *  2. A Web-API fallback is available in the browser, so the same code runs in
 *     both the Capacitor WebView and a plain browser tab.
 *
 * Design notes:
 *  - Native detection uses the `window.Capacitor` global (set by
 *    `@capacitor/core` at runtime in the native app) rather than a hard import,
 *    so the adapter has no runtime dependency on Capacitor in the browser.
 *  - The camera plugin is loaded via a **dynamic `import()`** only when we are
 *    on a native platform. This keeps the browser bundle free of the native
 *    plugin and avoids ESM/CJS interop issues in non-native environments.
 */

/** The result of a product scan (camera capture). */
export interface ScanResult {
  /** A `data:` URL (base64) of the captured image. */
  readonly image: string;
  /** Which path produced the image. */
  readonly source: 'capacitor' | 'web';
}

/** Options for a product scan. */
export interface ScanOptions {
  /** JPEG quality 0–100 (Capacitor). Default `80`. */
  quality?: number;
  /** Requested capture width in px (Capacitor). */
  width?: number;
  /** Requested capture height in px (Capacitor). */
  height?: number;
}

/** A description of the current runtime platform. */
export interface PlatformInfo {
  /** `true` when running inside a Capacitor native WebView. */
  readonly isNative: boolean;
  /** The resolved platform. */
  readonly platform: 'android' | 'ios' | 'web';
  /** The raw user-agent string (empty in non-browser environments). */
  readonly userAgent: string;
}

/**
 * Detect whether we are running inside a Capacitor native WebView.
 *
 * Uses the `window.Capacitor` global (installed by `@capacitor/core`) when
 * available, and falls back to the `window.__CAPACITOR__` marker. Returns
 * `false` in Node / SSR / a plain browser.
 */
function detectNative(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  const w = window as unknown as {
    Capacitor?: { isNativePlatform?: () => boolean };
    __CAPACITOR__?: unknown;
  };
  if (typeof w.Capacitor?.isNativePlatform === 'function') {
    return w.Capacitor.isNativePlatform();
  }
  return typeof w.__CAPACITOR__ !== 'undefined';
}

/**
 * The bridge adapter.
 *
 * Instantiate via {@link getBridgeAdapter} (shared instance) or directly for
 * testing. All methods are safe to call in the browser — they fall back to
 * Web APIs or throw a descriptive error when a capability is unavailable.
 */
export class BridgeAdapter {
  /** `true` when running inside a Capacitor native WebView. */
  isNativePlatform(): boolean {
    return detectNative();
  }

  /** Describe the current runtime platform. */
  getPlatformInfo(): PlatformInfo {
    const isNative = this.isNativePlatform();
    const userAgent =
      typeof navigator !== 'undefined' ? navigator.userAgent : '';
    let platform: 'android' | 'ios' | 'web' = 'web';
    if (isNative) {
      platform = /android/i.test(userAgent) ? 'android' : 'ios';
    }
    return { isNative, platform, userAgent };
  }

  /**
   * Capture a product image for the "scan product" demo.
   *
   * - **Native (Capacitor):** uses `@capacitor/camera` (loaded on demand).
   * - **Browser:** falls back to `getUserMedia` + a canvas snapshot.
   *
   * @throws When no camera path is available (e.g. an insecure browser
   *         context without `getUserMedia`).
   */
  async scanProduct(options: ScanOptions = {}): Promise<ScanResult> {
    if (this.isNativePlatform()) {
      return this.scanWithCapacitor(options);
    }
    return this.scanWithWebApi();
  }

  /** Native path: capture via the `@capacitor/camera` plugin. */
  private async scanWithCapacitor(
    options: ScanOptions,
  ): Promise<ScanResult> {
    // Dynamic import: the native plugin is only loaded when we are native,
    // keeping the browser bundle free of it.
    const {
      Camera,
      CameraDirection,
      CameraResultType,
      CameraSource,
    } = await import('@capacitor/camera');
    const photo = (await Camera.getPhoto({
      quality: options.quality ?? 80,
      width: options.width,
      height: options.height,
      direction: CameraDirection.Rear,
      resultType: CameraResultType.Base64,
      source: CameraSource.Camera,
      allowEditing: false,
    })) as { path?: string; webPath?: string; base64?: string };

    if (photo.base64) {
      return {
        image: `data:image/jpeg;base64,${photo.base64}`,
        source: 'capacitor',
      };
    }
    if (photo.webPath) {
      const image = await readLocalFileAsDataUrl(photo.webPath);
      return { image, source: 'capacitor' };
    }
    throw new Error('Capacitor camera returned no image data.');
  }

  /** Browser path: capture a frame via `getUserMedia` + canvas. */
  private async scanWithWebApi(): Promise<ScanResult> {
    if (
      typeof navigator === 'undefined' ||
      !navigator.mediaDevices?.getUserMedia
    ) {
      throw new Error(
        'Camera is unavailable in this environment. Open the app in a secure ' +
          'context (https or localhost), or run it in the Capacitor native app.',
      );
    }

    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment' },
      audio: false,
    });
    try {
      const video = document.createElement('video');
      video.srcObject = stream;
      video.muted = true;
      video.playsInline = true;
      await video.play();
      // Give the first frame a moment to be ready before snapshotting.
      await new Promise((resolve) => setTimeout(resolve, 250));

      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Could not create a 2D canvas context.');
      }
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      return { image: canvas.toDataURL('image/jpeg', 0.8), source: 'web' };
    } finally {
      stream.getTracks().forEach((track) => track.stop());
    }
  }
}

/**
 * Read a local (WebView) file path as a `data:` URL.
 *
 * In a Capacitor WebView, `photo.webPath` is a local path served by the
 * bridge; `fetch` resolves it to a blob which we then base64-encode.
 */
async function readLocalFileAsDataUrl(path: string): Promise<string> {
  const response = await fetch(path);
  const blob = await response.blob();
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

let _instance: BridgeAdapter | null = null;

/**
 * Returns the shared {@link BridgeAdapter} instance (created lazily).
 *
 * Use this from the shell / MFs so there is a single adapter per page.
 */
export function getBridgeAdapter(): BridgeAdapter {
  if (!_instance) {
    _instance = new BridgeAdapter();
  }
  return _instance;
}
