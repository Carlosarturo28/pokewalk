// app/_layout.tsx
import React, { useEffect, useCallback, useState } from 'react';
import { Slot } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import { ImageBackground, StyleSheet, StatusBar } from 'react-native';
import { LogBox } from 'react-native';

import { PokedexProvider } from '@/src/contexts/PokedexContext';
import { WalkProvider } from '@/src/contexts/WalkContext';
import { BackpackProvider } from '@/src/contexts/BackpackContext';
import { PlayerProvider } from '@/src/contexts/PlayerContext';
import { NotificationProvider } from '@/src/contexts/NotificationContext';
import { PortalProvider, PortalHost } from '@gorhom/portal';
import { RemoteConfigProvider } from '@/src/contexts/RemoteConfigContext';

LogBox.ignoreLogs(['AsyncStorage has been extracted from react-native core']);

export const NOTIFICATION_PORTAL_HOST = 'NotificationPortalHost';
export const MODAL_PORTAL_HOST = 'ModalPortalHost';

SplashScreen.preventAutoHideAsync().catch((e) => {
  console.warn(`SplashScreen.preventAutoHideAsync failed: ${e}`);
});

const CUSTOM_SPLASH_IMAGE = require('../assets/images/splash-screen.jpg');

export default function RootLayout() {
  const [assetsReady, setAssetsReady] = useState(false);
  const [showCustomSplash, setShowCustomSplash] = useState(true);

  useEffect(() => {
    async function prepareApp() {
      try {
      } catch (e) {
        console.warn('Error preparing minimal assets:', e);
      } finally {
        setAssetsReady(true);
      }
    }
    prepareApp();
  }, []);

  const onLayoutCustomSplashView = useCallback(async () => {
    if (assetsReady) {
      await SplashScreen.hideAsync();
    }
  }, [assetsReady]);

  useEffect(() => {
    if (assetsReady) {
      const timer = setTimeout(() => {
        setShowCustomSplash(false);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [assetsReady]);

  if (!assetsReady) {
    return null;
  }

  if (showCustomSplash) {
    return (
      <ImageBackground
        source={CUSTOM_SPLASH_IMAGE}
        style={styles.customSplashBackground}
        resizeMode='cover'
        onLayout={onLayoutCustomSplashView}
      >
        <StatusBar barStyle={'default'} />
      </ImageBackground>
    );
  }

  return (
    <PortalProvider>
      <RemoteConfigProvider>
        <SafeAreaProvider>
          <PortalHost name={NOTIFICATION_PORTAL_HOST} />
            <NotificationProvider>
              <PokedexProvider>
                <BackpackProvider>
                  <PlayerProvider>
                    <WalkProvider>
                      <Slot />
                      <StatusBar barStyle={'dark-content'} />
                      <PortalHost name={MODAL_PORTAL_HOST} />
                    </WalkProvider>
                  </PlayerProvider>
                </BackpackProvider>
              </PokedexProvider>
            </NotificationProvider>
          </SafeAreaProvider>
        </RemoteConfigProvider>
    </PortalProvider>
  );
}

const styles = StyleSheet.create({
  customSplashBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
