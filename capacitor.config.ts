import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.spendly.finance',
  appName: 'Spendly',
  webDir: 'dist',
  plugins: {
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#070A0F',
      overlaysWebView: false,
    },
    Keyboard: {
      resize: 'body',
      style: 'DARK',
    },
    LocalNotifications: {
      smallIcon: 'ic_stat_name',
      iconColor: '#10B981',
      sound: 'beep.wav',
    },
  },
};

export default config;
