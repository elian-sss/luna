import { StyleSheet, Text, type TextProps } from 'react-native';

import { Colors, Fonts, ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type ThemedTextProps = TextProps & {
  type?:
    | 'default'
    | 'bold'
    | 'small'
    | 'smallBold'
    | 'caption'
    | 'label'
    | 'kicker'
    | 'cardTitle'
    | 'subtitle'
    | 'title'
    | 'display';
  themeColor?: ThemeColor;
};

/**
 * Com fontes customizadas o peso vem da família (Figtree_700Bold etc.), não de fontWeight —
 * no Android fontWeight não troca o arquivo da fonte.
 */
export function ThemedText({ style, type = 'default', themeColor, ...rest }: ThemedTextProps) {
  const theme = useTheme();

  return <Text style={[{ color: theme[themeColor ?? 'text'] }, styles[type], style]} {...rest} />;
}

const heading = { fontFamily: Fonts.heading, letterSpacing: -0.3 } as const;

const styles = StyleSheet.create({
  default: { fontFamily: Fonts.body, fontSize: 15, lineHeight: 23 },
  bold: { fontFamily: Fonts.bodyBold, fontSize: 15, lineHeight: 23 },
  small: { fontFamily: Fonts.body, fontSize: 13, lineHeight: 19 },
  smallBold: { fontFamily: Fonts.bodyBold, fontSize: 13, lineHeight: 19 },
  caption: { fontFamily: Fonts.body, fontSize: 11, lineHeight: 16, color: Colors.textSecondary },
  label: { fontFamily: Fonts.body, fontSize: 12, lineHeight: 17, color: Colors.textLabel },
  kicker: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 10,
    lineHeight: 14,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: Colors.primary,
  },
  cardTitle: { ...heading, fontSize: 17, lineHeight: 21 },
  subtitle: { ...heading, fontSize: 20, lineHeight: 24 },
  title: { ...heading, fontSize: 26, lineHeight: 30 },
  display: { ...heading, fontSize: 42, lineHeight: 48 },
});
