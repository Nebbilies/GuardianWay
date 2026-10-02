import { Redirect } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { Screen } from '@/components/screen';
import { Stack } from '@/components/stack';
import { Alert, Button, Card, EmptyState, StatusBadge, TextField } from '@/components/ui';
import {
  radius as radiusTokens,
  spacing as spacingTokens,
  type SpacingToken,
  type TextVariant,
} from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export default function DesignSystemScreen() {
  const { colors, spacing } = useTheme();
  const [routeName, setRouteName] = useState('Tuyến xe buýt số 08');

  if (!__DEV__) {
    return <Redirect href="/" />;
  }

  const palette = [
    ['Industrial Navy', colors.primary],
    ['Guardian Orange', colors.accent],
    ['Steel Grey', colors.textMuted],
    ['Mist', colors.background],
    ['White', colors.surface],
  ] as const;
  const typeVariants: TextVariant[] = [
    'display',
    'pageTitle',
    'sectionTitle',
    'componentTitle',
    'body',
    'compact',
    'label',
    'mono',
  ];
  const spacingTokens = Object.entries(spacing) as [SpacingToken, number][];

  return (
    <Screen scroll contentContainerStyle={styles.page}>
      <Stack gap="sm">
        <AppText variant="label" tone="muted">
          DEVELOPMENT ONLY
        </AppText>
        <AppText variant="pageTitle">GuardianWay UI Foundation</AppText>
        <AppText tone="muted">
          Màn hình kiểm thử token, khả năng phóng to chữ và các trạng thái vận hành trước khi
          thành phần được đưa vào luồng nghiệp vụ thực tế.
        </AppText>
      </Stack>

      <Section title="Bảng màu">
        <Stack direction="row" gap="md" wrap>
          {palette.map(([name, value]) => (
            <Card key={name} style={styles.swatchCard}>
              <View style={[styles.swatch, { backgroundColor: value, borderColor: colors.border }]} />
              <AppText variant="compact">{name}</AppText>
              <AppText variant="mono" tone="muted">
                {value}
              </AppText>
            </Card>
          ))}
        </Stack>
      </Section>

      <Section title="Typography">
        <Card>
          <Stack gap="xl">
            {typeVariants.map((variant) => (
              <Stack key={variant} gap="xs">
                <AppText variant="label" tone="muted">
                  {variant}
                </AppText>
                <AppText variant={variant}>
                  Xe buýt 08 đã đến điểm đón Nguyễn Du
                </AppText>
              </Stack>
            ))}
          </Stack>
        </Card>
      </Section>

      <Section title="Spacing">
        <Card>
          <Stack gap="md">
            {spacingTokens.map(([token, value]) => (
              <Stack key={token} direction="row" gap="md" align="center">
                <AppText variant="mono" tone="muted" style={styles.tokenLabel}>
                  {token}
                </AppText>
                <View
                  style={{
                    width: value,
                    height: 12,
                    backgroundColor: colors.accent,
                  }}
                />
                <AppText variant="label" tone="muted">
                  {value}px
                </AppText>
              </Stack>
            ))}
          </Stack>
        </Card>
      </Section>

      <Section title="Button">
        <Card>
          <Stack gap="md">
            <Button fullWidth>Phân công xe buýt</Button>
            <Button variant="secondary" fullWidth>
              Xem thông tin tuyến
            </Button>
            <Button variant="destructive" fullWidth>
              Kết thúc chuyến đi
            </Button>
            <Button size="compact">Tác vụ nhỏ gọn</Button>
            <Button loading fullWidth>
              Đang cập nhật
            </Button>
            <Button disabled fullWidth>
              Không thể thực hiện
            </Button>
          </Stack>
        </Card>
      </Section>

      <Section title="TextField">
        <Card>
          <Stack gap="xl">
            <TextField
              label="Tên tuyến đường phục vụ học sinh vào khung giờ buổi sáng"
              helperText="Tên này sẽ hiển thị cho tài xế và điều phối viên."
              value={routeName}
              onChangeText={setRouteName}
            />
            <TextField
              label="Ghi chú vận hành"
              optional
              placeholder="Ví dụ: ưu tiên cổng phía Đông"
            />
            <TextField
              label="Biển số xe"
              error="Biển số không đúng định dạng. Ví dụ hợp lệ: 51B-123.45."
              value="51B"
            />
            <TextField label="Mã hệ thống" editable={false} value="GW-BUS-008" />
          </Stack>
        </Card>
      </Section>

      <Section title="Card">
        <Stack gap="md">
          <Card>
            <Stack gap="sm">
              <AppText variant="componentTitle">Chuyến đi buổi sáng</AppText>
              <AppText tone="muted">
                Xe 08 · Tài xế Nguyễn Văn Minh · Cập nhật vị trí 2 phút trước
              </AppText>
            </Stack>
          </Card>
          <Card muted>
            <AppText tone="muted">
              Surface phụ dành cho thông tin ít quan trọng hơn, không dùng shadow hoặc card lồng
              nhau.
            </AppText>
          </Card>
        </Stack>
      </Section>

      <Section title="StatusBadge">
        <Stack direction="row" gap="sm" wrap>
          <StatusBadge status="neutral" label="Chưa bắt đầu" />
          <StatusBadge status="success" label="Đang hoạt động" />
          <StatusBadge status="warning" label="GPS chậm cập nhật" />
          <StatusBadge status="danger" label="Mất kết nối" />
          <StatusBadge status="info" label="Đang đồng bộ" />
        </Stack>
      </Section>

      <Section title="Alert">
        <Stack gap="md">
          <Alert severity="neutral" title="Thông tin vận hành">
            Dữ liệu cuối cùng đã được lưu trên thiết bị này.
          </Alert>
          <Alert severity="success" title="Đã hoàn tất điểm đón">
            Tất cả học sinh tại điểm Nguyễn Du đã được ghi nhận lên xe.
          </Alert>
          <Alert severity="warning" title="Vị trí có thể đã cũ">
            Tín hiệu GPS gần nhất được nhận 8 phút trước. Hãy xác nhận với tài xế.
          </Alert>
          <Alert severity="danger" title="Không thể xác nhận học sinh xuống xe">
            Kết nối bị gián đoạn. Dữ liệu đã nhập vẫn được giữ an toàn trên thiết bị.
          </Alert>
          <Alert severity="info" title="Đang đồng bộ dữ liệu">
            Các thay đổi sẽ xuất hiện trên cổng quản trị sau khi đồng bộ hoàn tất.
          </Alert>
        </Stack>
      </Section>

      <Section title="EmptyState">
        <Card>
          <EmptyState
            icon={
              <View style={[styles.emptyIcon, { borderColor: colors.border }]}>
                <AppText variant="sectionTitle" tone="muted">
                  —
                </AppText>
              </View>
            }
            title="Chưa có chuyến đi được phân công"
            description="Khi điều phối viên phân công chuyến mới, thông tin xe, tuyến đường và giờ khởi hành sẽ xuất hiện tại đây."
            action={<Button variant="secondary">Tải lại dữ liệu</Button>}
          />
        </Card>
      </Section>
    </Screen>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Stack gap="md">
      <AppText variant="sectionTitle">{title}</AppText>
      {children}
    </Stack>
  );
}

const styles = StyleSheet.create({
  page: {
    gap: spacingTokens.section,
    paddingBottom: spacingTokens.layout + spacingTokens.section,
  },
  swatchCard: {
    width: 168,
    gap: spacingTokens.sm,
  },
  swatch: {
    height: spacingTokens.layout + spacingTokens.sm,
    borderRadius: radiusTokens.sm,
    borderWidth: 1,
  },
  tokenLabel: {
    width: spacingTokens.layout + spacingTokens.sm,
  },
  emptyIcon: {
    width: spacingTokens.section + spacingTokens.sm,
    height: spacingTokens.section + spacingTokens.sm,
    borderRadius: (spacingTokens.section + spacingTokens.sm) / 2,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
