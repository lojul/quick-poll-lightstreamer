import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.catpawvote.app',
  appName: 'CatPawVote',
  webDir: 'dist',
  plugins: {
    StatusBar: {
      backgroundColor: '#9333ea',
      style: 'LIGHT',
    },
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#9333ea',
      showSpinner: false,
      androidScaleType: 'CENTER_CROP',
      splashFullScreen: true,
      splashImmersive: true,
    },
  },
  ios: {
    contentInset: 'automatic',
    scheme: 'CatPawVote',
  },
  android: {
    backgroundColor: '#9333ea',
  },
};

export default config;
