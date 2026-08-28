import {
  BridgeAdapter,
  getBridgeAdapter,
} from './bridge-adapter';

/**
 * Tests for the Capacitor bridge adapter.
 *
 * The adapter is environment-agnostic: it detects the native platform via the
 * `window.Capacitor` global and falls back to Web APIs in the browser. These
 * tests cover both paths plus the singleton accessor.
 */

describe('BridgeAdapter', () => {
  const originalWindow = window;

  afterEach(() => {
    // Restore the global window between tests.
    (globalThis as unknown as { window: unknown }).window = originalWindow;
    delete (window as unknown as { Capacitor?: unknown }).Capacitor;
    delete (window as unknown as { __CAPACITOR__?: unknown }).__CAPACITOR__;
    jest.restoreAllMocks();
  });

  describe('platform detection', () => {
    it('reports a non-native (web) platform in a plain browser', () => {
      const adapter = new BridgeAdapter();
      expect(adapter.isNativePlatform()).toBe(false);

      const info = adapter.getPlatformInfo();
      expect(info.isNative).toBe(false);
      expect(info.platform).toBe('web');
    });

    it('reports a native Android platform when window.Capacitor says so', () => {
      (window as unknown as { Capacitor: unknown }).Capacitor = {
        isNativePlatform: () => true,
      };
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Linux; Android 14) Capacitor',
        configurable: true,
      });

      const adapter = new BridgeAdapter();
      expect(adapter.isNativePlatform()).toBe(true);
      expect(adapter.getPlatformInfo().platform).toBe('android');
    });

    it('reports a native iOS platform when window.Capacitor says so', () => {
      (window as unknown as { Capacitor: unknown }).Capacitor = {
        isNativePlatform: () => true,
      };
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)',
        configurable: true,
      });

      const adapter = new BridgeAdapter();
      expect(adapter.getPlatformInfo().platform).toBe('ios');
    });
  });

  describe('scanProduct — browser fallback', () => {
    it('throws a descriptive error when no camera path is available', async () => {
      // jsdom has no getUserMedia by default.
      const adapter = new BridgeAdapter();
      await expect(adapter.scanProduct()).rejects.toThrow(
        /Camera is unavailable/i,
      );
    });

    it('captures a frame via getUserMedia + canvas when available', async () => {
      // Mock a getUserMedia that returns a stream with one track.
      const track = { stop: jest.fn() };
      const stream = { getTracks: () => [track] };
      Object.defineProperty(navigator, 'mediaDevices', {
        value: { getUserMedia: jest.fn().mockResolvedValue(stream) },
        configurable: true,
      });

      // Mock HTMLVideoElement.play and the canvas 2D context.
      const playMock = jest.fn().mockResolvedValue(undefined);
      Object.defineProperty(HTMLVideoElement.prototype, 'play', {
        value: playMock,
        configurable: true,
      });
      const drawImage = jest.fn();
      const toDataURL = jest
        .fn()
        .mockReturnValue('data:image/jpeg;base64,TESTFRAME');
      const ctx = { drawImage, getContext: () => ctx } as unknown as CanvasRenderingContext2D;
      Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
        value: () => ctx,
        configurable: true,
      });
      Object.defineProperty(HTMLCanvasElement.prototype, 'toDataURL', {
        value: toDataURL,
        configurable: true,
      });

      const adapter = new BridgeAdapter();
      const result = await adapter.scanProduct();

      expect(result.source).toBe('web');
      expect(result.image).toBe('data:image/jpeg;base64,TESTFRAME');
      expect(track.stop).toHaveBeenCalled();
    });
  });

  describe('scanProduct — native (Capacitor) path', () => {
    it('uses @capacitor/camera and returns a base64 image', async () => {
      jest.mock('@capacitor/camera', () => ({
        Camera: {
          getPhoto: jest.fn().mockResolvedValue({
            base64: 'NATIVEBASE64',
          }),
        },
        CameraDirection: { Rear: 'REAR', Front: 'FRONT' },
        CameraResultType: { Base64: 'base64', Uri: 'uri', DataUrl: 'dataUrl' },
        CameraSource: { Prompt: 'PROMPT', Camera: 'CAMERA' },
      }));

      (window as unknown as { Capacitor: unknown }).Capacitor = {
        isNativePlatform: () => true,
      };

      const adapter = new BridgeAdapter();
      const result = await adapter.scanProduct({ quality: 90 });

      expect(result.source).toBe('capacitor');
      expect(result.image).toBe('data:image/jpeg;base64,NATIVEBASE64');
    });
  });

  describe('getBridgeAdapter', () => {
    it('returns a shared singleton instance', () => {
      const a = getBridgeAdapter();
      const b = getBridgeAdapter();
      expect(a).toBe(b);
      expect(a).toBeInstanceOf(BridgeAdapter);
    });
  });
});
