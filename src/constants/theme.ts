/**
 * Tokens do design system "Organic" (protótipo PetCare no claude.ai/design):
 * fundo creme, acento terracota, segundo acento sálvia, Caprasimo nos títulos e Figtree no texto.
 * O sistema só define tema claro (app.json fixa userInterfaceStyle = light).
 */

import '@/global.css';

export const Colors = {
  // Papéis
  background: '#f5ead8',
  backgroundElement: '#ebddc5', // --color-surface
  text: '#201e1d',
  textSecondary: 'rgba(32, 30, 29, 0.55)',
  textLabel: 'rgba(32, 30, 29, 0.7)',
  textFaint: 'rgba(32, 30, 29, 0.4)',
  border: 'rgba(32, 30, 29, 0.16)', // --color-divider
  pressed: 'rgba(32, 30, 29, 0.07)',

  // Acento (terracota)
  primary: '#c67139',
  onPrimary: '#f5ead8',
  accent100: '#fff2eb',
  accent200: '#ffe1d0',
  accent600: '#b2622d',
  accent700: '#8c491a',
  accent800: '#643312',

  // Segundo acento (sálvia)
  accent2: '#7a8a5e',
  accent2_100: '#f0fae1',
  accent2_700: '#56633f',
  accent2_800: '#3d472b',

  // Neutros
  neutral100: '#f9f4ed',
  neutral800: '#474238',

  // O sistema não tem vermelho: erros e ações destrutivas usam o tom escuro do acento.
  danger: '#8c491a',
  success: '#56633f',
} as const;

export type ThemeColor = keyof typeof Colors;

/** Famílias carregadas em src/app/_layout.tsx (useFonts). */
export const Fonts = {
  heading: 'Caprasimo_400Regular',
  body: 'Figtree_400Regular',
  bodySemiBold: 'Figtree_600SemiBold',
  bodyBold: 'Figtree_700Bold',
} as const;

/** Escala de espaçamento do sistema (densidade 1,1×). */
export const Spacing = {
  half: 2,
  one: 4,
  two: 9,
  three: 13,
  four: 18,
  five: 26,
  six: 35,
} as const;

/** Margem lateral das telas. */
export const Margem = 20;

export const Radius = {
  sm: 8,
  md: 16,
  /** Cartões e diálogos (radius-lg × 1,15 no "rounded frame" do sistema). */
  cartao: 32,
  pill: 999,
} as const;

export const Sombra = {
  sm: '0 1px 2px rgba(46, 43, 37, 0.14)',
  md: '0 3px 10px rgba(46, 43, 37, 0.16)',
} as const;

export const MaxContentWidth = 800;
