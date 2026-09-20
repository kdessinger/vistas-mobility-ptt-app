import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.vistasmobility.ptt',
  appName: 'Vistas Mobility PTT',
  webDir: 'client/dist',
  server: {
    androidScheme: 'https',
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#0a0f1c',
    },
  },
  ios: {
    contentInset: 'always',
    backgroundColor: '#0a0f1c',
  },
};

export default config;
