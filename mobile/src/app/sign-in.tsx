import { useState } from 'react';
import { Image } from 'expo-image';
import { StyleSheet } from 'react-native';

import { useAuthStore } from '@/auth/auth-store';
import { AppText } from '@/components/app-text';
import { Screen } from '@/components/screen';
import { Stack } from '@/components/stack';
import { Alert, Button, TextField } from '@/components/ui';
import { useTheme } from '@/hooks/use-theme';

export default function SignInScreen() {
  const signIn = useAuthStore((state) => state.signIn);
  const { spacing } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      await signIn(email.trim(), password);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Không thể đăng nhập. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen scroll contentContainerStyle={styles.content}>
      <Stack gap="xxl" style={styles.form}>
        <Stack gap="lg" align="center">
          <Image
            accessibilityLabel="Biểu tượng GuardianWay"
            contentFit="contain"
            source={require('@/assets/brand/splash-icon.png')}
            style={{ width: spacing.layout, height: spacing.layout }}
          />
          <Stack gap="sm" align="center">
            <AppText variant="pageTitle" style={styles.centered}>
              Đăng nhập
            </AppText>
            <AppText tone="muted" style={styles.centered}>
              Dành cho tài xế và phụ huynh GuardianWay.
            </AppText>
          </Stack>
        </Stack>

        <Stack gap="lg">
          <TextField
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            label="Email"
            onChangeText={setEmail}
            returnKeyType="next"
            textContentType="emailAddress"
            value={email}
          />
          <TextField
            autoCapitalize="none"
            autoComplete="password"
            label="Mật khẩu"
            onChangeText={setPassword}
            onSubmitEditing={() => void submit()}
            returnKeyType="go"
            secureTextEntry
            textContentType="password"
            value={password}
          />
          {error ? (
            <Alert severity="danger" title="Đăng nhập không thành công">
              {error}
            </Alert>
          ) : null}
          <Button
            accessibilityLabel="Đăng nhập vào GuardianWay"
            fullWidth
            loading={submitting}
            onPress={() => void submit()}>
            Đăng nhập
          </Button>
        </Stack>
      </Stack>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  form: {
    width: '100%',
    maxWidth: 480,
  },
  centered: {
    textAlign: 'center',
  },
});
