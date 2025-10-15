import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AuthProvider } from "@/contexts/AuthContext";
import { HospitalProvider, useHospital } from "@/contexts/HospitalContext";
import { UserManagementProvider } from "@/contexts/UserManagementContext";
import { LanguageProvider, useLanguage } from "@/contexts/LanguageContext";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerBackTitle: "Back" }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}

function LanguageSyncWrapper({ children }: { children: React.ReactNode }) {
  const { hospitalSettings } = useHospital();
  const { setLanguage } = useLanguage();

  useEffect(() => {
    if (hospitalSettings.language) {
      console.log('LanguageSyncWrapper: Syncing language to:', hospitalSettings.language);
      setLanguage(hospitalSettings.language);
    }
  }, [hospitalSettings.language, setLanguage]);

  return <>{children}</>;
}

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <AuthProvider>
          <UserManagementProvider>
            <HospitalProvider>
              <LanguageSyncWrapper>
                <GestureHandlerRootView style={{ flex: 1 }}>
                  <RootLayoutNav />
                </GestureHandlerRootView>
              </LanguageSyncWrapper>
            </HospitalProvider>
          </UserManagementProvider>
        </AuthProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
}
