import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.rashikfarhan.aitext2doc',
  appName: 'Text2Doc',
  webDir: 'dist',
  server: {
    androidScheme: 'https', // Required to avoid mixed-content issues in WebView
  },
  android: {
    allowMixedContent: true,
    webContentsDebuggingEnabled: false,
  }
};

export default config;
