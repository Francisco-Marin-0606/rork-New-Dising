import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import * as SystemUI from "expo-system-ui";
import * as ScreenOrientation from "expo-screen-orientation";
import { StyleSheet, Platform } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

// Only prevent auto hide on native platforms
if (Platform.OS !== 'web') {
  SplashScreen.preventAutoHideAsync();
}

const queryClient = new QueryClient();

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerBackTitle: "Back", contentStyle: { backgroundColor: 'transparent' } }}>
      <Stack.Screen name="login" options={{ headerShown: false, statusBarTranslucent: true, statusBarBackgroundColor: 'transparent' }} />
      <Stack.Screen name="index" options={{ headerShown: false, statusBarTranslucent: true, statusBarBackgroundColor: 'transparent' }} />
      <Stack.Screen name="success" options={{ headerShown: false, statusBarTranslucent: true, statusBarBackgroundColor: 'transparent', animation: 'fade' }} />
    </Stack>
  );
}

export default function RootLayout() {
  useEffect(() => {
    const initializeApp = async () => {
      try {
        if (Platform.OS !== 'web') {
          await SystemUI.setBackgroundColorAsync("transparent").catch((e) => console.log("SystemUI error", e));
          await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
          await SplashScreen.hideAsync();
        }
      } catch (error) {
        console.log('App initialization error:', error);
      }
    };

    initializeApp();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={styles.flex} testID="gesture-root">
        <RootLayoutNav />
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
});
