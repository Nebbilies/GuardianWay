import { Image } from 'expo-image';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { Screen } from '@/components/screen';
import { Stack } from '@/components/stack';
import { Button, Card, StatusBadge } from '@/components/ui';
import { spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export default function HomeScreen() {
  const { colors, radius, spacing } = useTheme();

  return (
    <Screen contentContainerStyle={styles.content}>
      <Card style={styles.card}>
        <Stack gap="xl" align="center">
          <Image
            accessibilityLabel="Biểu tượng GuardianWay"
            contentFit="contain"
            source={require('@/assets/brand/splash-icon.png')}
            style={styles.logo}
          />
          <Stack gap="sm" align="center">
            <View
              style={{
                width: 48,
                height: 4,
                borderRadius: radius.xs,
                backgroundColor: colors.accent,
              }}
            />
            <AppText variant="pageTitle" style={styles.centered}>
              GuardianWay
            </AppText>
            <AppText tone="muted" style={styles.centered}>
              Nền tảng vận hành giao thông học đường an toàn, rõ ràng và có trách nhiệm.
            </AppText>
          </Stack>
          <StatusBadge status="success" label="UI foundation sẵn sàng" />
          {__DEV__ ? (
            <Button fullWidth onPress={() => router.push('/design-system')}>
              Mở thư viện thành phần
            </Button>
          ) : null}
        </Stack>
      </Card>
      <AppText variant="label" tone="muted" style={{ marginTop: spacing.lg }}>
        Giao diện sáng · Noto Sans · Thiết kế công nghiệp
      </AppText>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    width: '100%',
    maxWidth: 520,
  },
  logo: {
    width: spacing.layout + spacing.section,
    height: spacing.layout + spacing.section,
  },
  centered: {
    textAlign: 'center',
  },
});
