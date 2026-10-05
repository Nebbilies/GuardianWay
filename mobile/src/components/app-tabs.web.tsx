import { TabList, TabSlot, Tabs, TabTrigger, type TabTriggerSlotProps } from 'expo-router/ui';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { colors, radius, spacing, theme } from '@/constants/theme';

export default function AppTabs() {
  return (
    <Tabs>
      <TabSlot style={styles.slot} />
      <TabList asChild>
        <View style={styles.tabBar}>
          <TabTrigger name="home" href="/" asChild>
            <TabButton>Trang chủ</TabButton>
          </TabTrigger>
          {__DEV__ ? (
            <TabTrigger name="design-system" href="/design-system" asChild>
              <TabButton>Thành phần</TabButton>
            </TabTrigger>
          ) : null}
        </View>
      </TabList>
    </Tabs>
  );
}

function TabButton({ children, isFocused, ...props }: TabTriggerSlotProps) {
  return (
    <Pressable
      accessibilityRole="tab"
      {...props}
      style={({ pressed }) => [
        styles.tab,
        isFocused && styles.tabSelected,
        pressed && styles.tabPressed,
      ]}>
      <AppText variant="compact" tone={isFocused ? 'default' : 'muted'}>
        {children}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  slot: {
    height: '100%',
  },
  tabBar: {
    position: 'absolute',
    bottom: spacing.lg,
    alignSelf: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
    padding: spacing.xs,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    backgroundColor: colors.surface,
  },
  tab: {
    minHeight: theme.compactControlHeight,
    minWidth: 96,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
  },
  tabSelected: {
    backgroundColor: colors.surfaceSelected,
  },
  tabPressed: {
    opacity: 0.76,
  },
});
