// app/_layout.tsx
import React from 'react';
import { Slot } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
// Usar alias
import { PokedexProvider } from '@/src/contexts/PokedexContext';
import { WalkProvider } from '@/src/contexts/WalkContext';
import { BackpackProvider } from '@/src/contexts/BackpackContext';
import { PlayerProvider } from '@/src/contexts/PlayerContext'; // <-- Importar PlayerProvider
import { StatusBar } from 'expo-status-bar';
import Toast from 'react-native-toast-message';

import { LogBox } from 'react-native';
import { toastConfig } from './toastConfig';
import { NotificationProvider } from '@/src/contexts/NotificationContext';
LogBox.ignoreLogs(['AsyncStorage has been extracted from react-native core']);

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <NotificationProvider>
        {/* Envuelve todo con PlayerProvider */}
        <PlayerProvider>
          <PokedexProvider>
            <BackpackProvider>
              <WalkProvider>
                <Slot />

                <StatusBar style='auto' />
              </WalkProvider>
            </BackpackProvider>
          </PokedexProvider>
        </PlayerProvider>
      </NotificationProvider>
    </SafeAreaProvider>
  );
}
