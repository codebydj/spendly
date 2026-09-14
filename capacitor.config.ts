import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.spendly.finance',
  appName: 'Spendly',
  webDir: 'dist',
  plugins: {
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#00000000',
      overlaysWebView: true,
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
