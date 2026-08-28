import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.microfrontend.shell',
  appName: 'MicroFrontend',
  webDir: 'web',
  server: {
    // Allow the shell to reach the gateway on the host machine during dev.
    // In production the gateway URL is resolved at runtime by the shell.
    androidScheme: 'https',
  },
  plugins: {
    Camera: {
      // Request the rear camera by default for the "scan product" demo.
      direction: 'REAR',
    },
  },
};

export default config;
