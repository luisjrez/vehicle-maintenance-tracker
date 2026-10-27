import { Color } from 'expo-router';
import { Platform, type ColorValue } from 'react-native';

/** Picks the native semantic color per platform; both adapt to light/dark mode on device. */
function semantic(ios: ColorValue, android: ColorValue, fallback: string): ColorValue {
  return Platform.select<ColorValue>({ ios, android, default: fallback });
}

export const colors = {
  background: semantic(Color.ios.systemGroupedBackground, Color.android.dynamic.surfaceContainer, '#f2f2f7'),
  card: semantic(Color.ios.secondarySystemGroupedBackground, Color.android.dynamic.surface, '#ffffff'),
  fill: semantic(Color.ios.tertiarySystemFill, Color.android.dynamic.surfaceContainerHighest, '#e5e5ea'),
  label: semantic(Color.ios.label, Color.android.dynamic.onSurface, '#000000'),
  secondaryLabel: semantic(Color.ios.secondaryLabel, Color.android.dynamic.onSurfaceVariant, '#6b7280'),
  separator: semantic(Color.ios.separator, Color.android.dynamic.outlineVariant, '#c6c6c8'),
  tint: semantic(Color.ios.systemBlue, Color.android.dynamic.primary, '#007aff'),
  onTint: semantic('#ffffff', Color.android.dynamic.onPrimary, '#ffffff'),
  destructive: semantic(Color.ios.systemRed, Color.android.dynamic.error, '#dc2626'),
  warningBackground: semantic(Color.ios.systemRed, Color.android.dynamic.errorContainer, '#fee2e2'),
} as const;
