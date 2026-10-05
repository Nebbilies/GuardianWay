import {
  NotoSans_400Regular,
  NotoSans_500Medium,
  NotoSans_600SemiBold,
  NotoSans_700Bold,
} from '@expo-google-fonts/noto-sans';
import { useFonts } from 'expo-font';
import { Stack, ThemeProvider, type Theme } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet } from 'react-native';

import '@/global.css';

import { AppText } from '@/components/app-text';
import { Button } from '@/components/ui';
import { Screen } from '@/components/screen';
import { Stack as LayoutStack } from '@/components/stack';
import { colors } from '@/constants/theme';
import { useAuthStore } from '@/auth/auth-store';

SplashScreen.preventAutoHideAsync();

const navigationTheme: Theme = {
  dark: false,
  colors: {
    primary: colors.accent,
    background: colors.background,
    card: colors.surface,
    text: colors.text,
    border: colors.border,
    notification: colors.danger,
  },
  fonts: {
    regular: { fontFamily: 'NotoSans_400Regular', fontWeight: '400' },
    medium: { fontFamily: 'NotoSans_500Medium', fontWeight: '500' },
    bold: { fontFamily: 'NotoSans_700Bold', fontWeight: '700' },
    heavy: { fontFamily: 'NotoSans_700Bold', fontWeight: '700' },
  },
};

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    NotoSans_400Regular,
    NotoSans_500Medium,
    NotoSans_600SemiBold,
    NotoSans_700Bold,
  });
  const status = useAuthStore((state) => state.status);
  const restoreSession = useAuthStore((state) => state.restoreSession);

  useEffect(() => {
    void restoreSession();
  }, [restoreSession]);

  useEffect(() => {
    if (fontError && __DEV__) {
      console.warn('Không thể tải Noto Sans; ứng dụng sẽ dùng font hệ thống.', fontError);
    }

    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontError, fontsLoaded]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <ThemeProvider value={navigationTheme}>
      <StatusBar style="dark" />
      {status === 'restoring' ? (
        <Screen contentContainerStyle={styles.statusScreen}>
          <LayoutStack gap="lg" align="center">
            <ActivityIndicator color={colors.primary} />
            <AppText tone="muted">Đang khôi phục phiên đăng nhập…</AppText>
          </LayoutStack>
        </Screen>
      ) : status === 'unavailable' ? (
        <Screen contentContainerStyle={styles.statusScreen}>
          <LayoutStack gap="lg" align="center">
            <AppText variant="sectionTitle">Chưa thể kết nối</AppText>
            <AppText tone="muted" style={styles.centered}>
              Kiểm tra kết nối mạng rồi thử khôi phục phiên lần nữa.
            </AppText>
            <Button onPress={() => void restoreSession()}>Thử lại</Button>
          </LayoutStack>
        </Screen>
      ) : (
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Protected guard={status === 'signedOut'}>
            <Stack.Screen name="sign-in" />
          </Stack.Protected>
          <Stack.Protected guard={status === 'signedIn'}>
            <Stack.Screen name="(app)" />
          </Stack.Protected>
        </Stack>
      )}
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  statusScreen: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  centered: {
    textAlign: 'center',
  },
});
