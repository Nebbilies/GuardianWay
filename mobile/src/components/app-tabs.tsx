import { NativeTabs } from 'expo-router/unstable-native-tabs';

import { colors } from '@/constants/theme';

export default function AppTabs() {
  return (
    <NativeTabs
      backgroundColor={colors.surface}
      iconColor={{ default: colors.textMuted, selected: colors.accent }}
      indicatorColor={colors.surfaceSelected}
      labelStyle={{
        default: { color: colors.textMuted, fontFamily: 'NotoSans_500Medium' },
        selected: { color: colors.text, fontFamily: 'NotoSans_600SemiBold' },
      }}>
      <NativeTabs.Trigger name="index" disableTransparentOnScrollEdge>
        <NativeTabs.Trigger.Label>Trang chủ</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          src={require('@/assets/images/tabIcons/home.png')}
          renderingMode="template"
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="design-system" hidden={!__DEV__} disableTransparentOnScrollEdge>
        <NativeTabs.Trigger.Label>Thành phần</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          src={require('@/assets/images/tabIcons/explore.png')}
          renderingMode="template"
        />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
