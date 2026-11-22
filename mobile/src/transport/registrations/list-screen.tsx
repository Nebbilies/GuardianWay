import { Link, router, useLocalSearchParams } from 'expo-router';
import { useSyncExternalStore } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { AppText } from '@/components/app-text';
import { Stack } from '@/components/stack';
import { Alert, Button, Card, EmptyState } from '@/components/ui';
import { colors, spacing } from '@/constants/theme';

import type { RegistrationSession } from './session';
import { useRegistrationSession } from './registration-provider';
import {
  RegistrationLoadState,
  RegistrationPage,
  RegistrationStatus,
  summarizeRegistration,
} from './registration-ui';

export function RegistrationListScreen() {
  const state = useRegistrationSession();
  return (
    <RegistrationPage
      title="Đăng ký xe"
      schoolName={state && 'ready' in state ? state.ready.schoolName : null}
      tabbed
    >
      {state && 'ready' in state ? (
        <RegistrationList session={state.ready} />
      ) : (
        <RegistrationLoadState error={state?.error} />
      )}
    </RegistrationPage>
  );
}

function RegistrationList({ session }: { session: RegistrationSession }) {
  const rows = useSyncExternalStore(
    session.subscribe,
    session.getSnapshot,
    session.getSnapshot,
  );
  const { submitted } = useLocalSearchParams<{ submitted?: string }>();
  const justSubmitted =
    typeof submitted === 'string' &&
    submitted.startsWith('local-') &&
    session.find(submitted);

  return (
    <>
      {justSubmitted ? (
        <Alert severity="success" title="Đã gửi đăng ký">
          Bạn có thể theo dõi kết quả trong danh sách.
        </Alert>
      ) : null}
      <Button fullWidth onPress={() => router.push('/registrations/new')}>
        Tạo đăng ký
      </Button>
      {rows.length ? (
        <>
          <AppText variant="componentTitle" accessibilityRole="header">
            Yêu cầu đã gửi
          </AppText>
          {rows.map((row) => {
            const { period, direction } = summarizeRegistration(row);
            return (
              <Link
                key={row.id}
                href={{
                  pathname: '/registrations/detail',
                  params: { id: row.id },
                }}
                asChild
              >
                <Pressable
                  accessibilityRole="link"
                  accessibilityLabel={
                    'Chi tiết đăng ký của ' +
                    row.student.name +
                    (period ? ', ' + period : '')
                  }
                >
                  {({ pressed }) => (
                    <Card style={[styles.row, pressed && styles.pressed]}>
                      <Stack gap="xs" style={styles.content}>
                        <Stack
                          direction="row"
                          wrap
                          gap="sm"
                          align="center"
                          justify="space-between"
                        >
                          <AppText variant="compact">
                            {row.student.name}
                          </AppText>
                          <RegistrationStatus status={row.status} />
                        </Stack>
                        <AppText variant="compact" tone="muted">
                          {[period, direction].filter(Boolean).join(' · ')}
                        </AppText>
                      </Stack>
                      <AppText tone="muted" accessible={false}>
                        ›
                      </AppText>
                    </Card>
                  )}
                </Pressable>
              </Link>
            );
          })}
        </>
      ) : (
        <Card>
          <EmptyState
            title="Chưa có đăng ký"
            description="Đơn đã gửi sẽ xuất hiện ở đây để bạn theo dõi trạng thái."
          />
        </Card>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, minWidth: 0 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
  },
  pressed: { backgroundColor: colors.surfaceSelected },
});
