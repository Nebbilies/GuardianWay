import { router, useLocalSearchParams } from 'expo-router';

import { AppText } from '@/components/app-text';
import { Stack } from '@/components/stack';
import { Alert, Button, Card, EmptyState } from '@/components/ui';

import type { Registration } from '../../../../fixtures/transport/contract';
import { directionLabels, formatCivilDate, serviceDirections } from './draft';
import { useRegistrationSession } from './registration-provider';
import {
  RegistrationLoadState,
  RegistrationPage,
  RegistrationStatus,
  summarizeRegistration,
} from './registration-ui';

function returnToList() {
  router.dismissTo('/registrations');
}

export function RegistrationDetailScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const state = useRegistrationSession();
  const registration =
    state && 'ready' in state && typeof id === 'string'
      ? state.ready.find(id)
      : undefined;

  return (
    <RegistrationPage title="Chi tiết đăng ký" onBack={returnToList}>
      {registration ? (
        <Detail registration={registration} />
      ) : state && 'ready' in state ? (
        <Card>
          <EmptyState
            title="Không tìm thấy đăng ký"
            description="Mở danh sách để xem các đăng ký của bạn."
            action={
              <Button variant="secondary" onPress={returnToList}>
                Về danh sách
              </Button>
            }
          />
        </Card>
      ) : (
        <RegistrationLoadState error={state?.error} />
      )}
    </RegistrationPage>
  );
}

function Detail({ registration }: { registration: Registration }) {
  const { dates, period, direction } = summarizeRegistration(registration);
  return (
    <>
      <Card>
        <Stack gap="sm">
          <Stack direction="row" wrap align="center" justify="space-between">
            <AppText variant="componentTitle">
              {registration.student.name}
            </AppText>
            <RegistrationStatus status={registration.status} />
          </Stack>
          <AppText variant="compact" tone="muted">
            {[registration.student.code, direction].filter(Boolean).join(' · ')}
          </AppText>
          {period ? <AppText variant="compact">{period}</AppText> : null}
        </Stack>
      </Card>
      {dates.length ? (
        <Card>
          <Stack gap="sm">
            <AppText variant="compact" accessibilityRole="header">
              Ngày đăng ký đi xe
            </AppText>
            <AppText tone="muted" variant="compact">
              {dates.map(formatCivilDate).join(', ')}
            </AppText>
          </Stack>
        </Card>
      ) : null}
      {serviceDirections.map((side) => {
        const groups = new Map<
          string,
          {
            requested: string | undefined;
            approved: string | undefined;
            dates: string[];
          }
        >();
        for (const day of registration.days) {
          if (day.direction !== side) continue;
          const key = JSON.stringify([
            day.requestedStop?.id,
            day.approvedStop?.id,
          ]);
          const existing = groups.get(key);
          if (existing) existing.dates.push(day.serviceDate);
          else
            groups.set(key, {
              requested: day.requestedStop?.name,
              approved: day.approvedStop?.name,
              dates: [day.serviceDate],
            });
        }
        if (!groups.size) return null;
        return (
          <Card key={side}>
            <Stack gap="md">
              <AppText variant="compact" accessibilityRole="header">
                {directionLabels[side]}
              </AppText>
              {[...groups].map(([key, group]) => (
                <Stack key={key} gap="xs">
                  {groups.size > 1 ? (
                    <AppText variant="label" tone="muted">
                      {group.dates.sort().map(formatCivilDate).join(', ')}
                    </AppText>
                  ) : null}
                  <AppText variant="label" tone="muted">
                    Điểm đề nghị
                  </AppText>
                  <AppText variant="compact">
                    {group.requested ?? 'Chưa có điểm đề nghị'}
                  </AppText>
                  {group.approved ? (
                    <>
                      <AppText variant="label" tone="muted">
                        Điểm được duyệt
                      </AppText>
                      <AppText variant="compact">{group.approved}</AppText>
                    </>
                  ) : null}
                </Stack>
              ))}
            </Stack>
          </Card>
        );
      })}
      {registration.reviewNote ? (
        <Alert
          severity={registration.status === 'REJECTED' ? 'danger' : 'info'}
          title="Phản hồi của trường"
        >
          {registration.reviewNote}
        </Alert>
      ) : null}
    </>
  );
}
