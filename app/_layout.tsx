/*
 * SPDX-FileCopyrightText: 2026 Karsaaz
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Buffer } from "buffer";

globalThis.Buffer = Buffer;

import { useEffect } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SafeAreaProvider } from "react-native-safe-area-context";
import * as SplashScreen from "expo-splash-screen";
import { useAuthStore } from "@/src/stores/authStore";
import { useOnboardingStore } from "@/src/stores/onboardingStore";
import { useFavoritesStore } from "@/src/stores/favoritesStore";
import { useTagsStore } from "@/src/stores/tagsStore";
import { registerBackgroundSync } from "@/src/sync/backgroundTask";
import { debugLog } from "@/src/utils/debugLog";
import "../src/sync/backgroundTask";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

export default function RootLayout() {
  const hydrateAuth = useAuthStore((s) => s.hydrate);
  const hydrateOnboarding = useOnboardingStore((s) => s.hydrate);
  const hydrateFavorites = useFavoritesStore((s) => s.hydrate);
  const hydrateTags = useTagsStore((s) => s.hydrate);
  const isAuthHydrated = useAuthStore((s) => s.isHydrated);
  const isOnboardingHydrated = useOnboardingStore((s) => s.isHydrated);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const onboardingComplete = useOnboardingStore((s) => s.isComplete);
  const segments = useSegments();
  const router = useRouter();

  const isHydrated = isAuthHydrated && isOnboardingHydrated;

  useEffect(() => {
    Promise.all([hydrateAuth(), hydrateOnboarding(), hydrateFavorites(), hydrateTags()]).finally(
      () => {
        SplashScreen.hideAsync();
        debugLog(
          "app/_layout.tsx:hydrate",
          "stores hydrated",
          {
            isAuthenticated: useAuthStore.getState().isAuthenticated,
            onboardingComplete: useOnboardingStore.getState().isComplete,
          },
          "E",
          "post-fix"
        );
      }
    );
    registerBackgroundSync().catch(() => undefined);
  }, [hydrateAuth, hydrateOnboarding, hydrateFavorites, hydrateTags]);

  useEffect(() => {
    if (!isHydrated) return;
    const routeSegments = segments as string[];
    const inAuth = routeSegments[0] === "(auth)";
    const authScreen = routeSegments[1];
    const isSplashOrOnboarding =
      authScreen === "splash" || authScreen === "onboarding" || authScreen === undefined;

    if (!isAuthenticated && !inAuth) {
      debugLog("app/_layout.tsx:auth", "redirect unauthenticated to splash", { segments: routeSegments }, "E");
      router.replace("/(auth)/splash");
      return;
    }

    if (!isAuthenticated && inAuth && !isSplashOrOnboarding && !onboardingComplete) {
      debugLog("app/_layout.tsx:auth", "redirect to onboarding", { authScreen }, "E");
      router.replace("/(auth)/onboarding");
      return;
    }

    if (isAuthenticated && inAuth) {
      debugLog("app/_layout.tsx:auth", "redirect authenticated to home", { authScreen }, "E");
      router.replace("/(tabs)/files");
    }
  }, [isHydrated, isAuthenticated, onboardingComplete, segments, router]);

  if (!isHydrated) return null;

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="preview" options={{ presentation: "modal", headerShown: false }} />
          <Stack.Screen name="share" options={{ presentation: "modal", headerShown: false }} />
        </Stack>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
