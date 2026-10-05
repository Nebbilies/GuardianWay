import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import type { SpacingToken } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type ScreenProps = {
  children: ReactNode;
  scroll?: boolean;
  padding?: SpacingToken;
  edges?: Edge[];
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
  testID?: string;
};

export function Screen({
  children,
  scroll = false,
  padding = 'lg',
  edges = ['top', 'right', 'bottom', 'left'],
  style,
  contentContainerStyle,
  testID,
}: ScreenProps) {
  const { colors, maxContentWidth, spacing } = useTheme();
  const contentStyle = [
    styles.content,
    { maxWidth: maxContentWidth, padding: spacing[padding] },
    contentContainerStyle,
  ];

  return (
    <SafeAreaView
      edges={edges}
      style={[styles.screen, { backgroundColor: colors.background }, style]}
      testID={testID}>
      {scroll ? (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View style={contentStyle}>{children}</View>
        </ScrollView>
      ) : (
        <View style={contentStyle}>
          {children}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    width: '100%',
    boxSizing: 'border-box',
    alignSelf: 'center',
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
  },
});
