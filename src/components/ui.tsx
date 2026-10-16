import { router } from 'expo-router';
import { Children, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Icone, type NomeIcone } from '@/components/icone';
import { ThemedText } from '@/components/themed-text';
import { Colors, Fonts, Margem, MaxContentWidth, Radius, Sombra, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/**
 * Container padrão das telas: área segura, rolagem e largura máxima (tablet/web).
 * O cabeçalho fica fora da rolagem, como no protótipo.
 */
export function Tela({
  children,
  cabecalho,
  rolar = true,
}: {
  children: ReactNode;
  cabecalho?: ReactNode;
  rolar?: boolean;
}) {
  const theme = useTheme();
  const conteudo = <View style={styles.conteudo}>{children}</View>;
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      {cabecalho ? <View style={styles.largura}>{cabecalho}</View> : null}
      {rolar ? (
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.rolagem}>
          {conteudo}
        </ScrollView>
      ) : (
        conteudo
      )}
    </SafeAreaView>
  );
}

/** Cabeçalho das telas internas: botão circular de voltar + título em Caprasimo. */
export function Cabecalho({
  titulo,
  subtitulo,
  voltar = true,
  direita,
}: {
  titulo: string;
  subtitulo?: string;
  voltar?: boolean;
  direita?: ReactNode;
}) {
  return (
    <View style={styles.cabecalho}>
      {voltar ? (
        <BotaoCircular icone="voltar" rotulo="Voltar" onPress={() => router.back()} tom="superficie" />
      ) : null}
      <View style={{ flex: 1 }}>
        <ThemedText type="subtitle" numberOfLines={1}>
          {titulo}
        </ThemedText>
        {subtitulo ? <ThemedText type="label">{subtitulo}</ThemedText> : null}
      </View>
      {direita}
    </View>
  );
}

type BotaoProps = {
  titulo: string;
  onPress: () => void;
  variante?: 'primario' | 'secundario' | 'fantasma' | 'perigo';
  icone?: NomeIcone;
  carregando?: boolean;
  desabilitado?: boolean;
  style?: ViewStyle;
};

export function Botao({ titulo, onPress, variante = 'primario', icone, carregando, desabilitado, style }: BotaoProps) {
  const theme = useTheme();
  const primario = variante === 'primario';
  const cor = primario
    ? theme.onPrimary
    : variante === 'fantasma'
      ? theme.accent700
      : variante === 'perigo'
        ? theme.danger
        : theme.text;
  const inativo = desabilitado || carregando;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: inativo }}
      onPress={onPress}
      disabled={inativo}
      style={({ pressed }) => [
        styles.botao,
        primario
          ? { backgroundColor: pressed ? theme.accent700 : theme.primary }
          : variante === 'fantasma' || variante === 'perigo'
            ? { backgroundColor: pressed ? 'rgba(198, 113, 57, 0.18)' : 'transparent' }
            : { borderColor: theme.border, backgroundColor: pressed ? theme.pressed : 'transparent' },
        { opacity: inativo ? 0.45 : 1 },
        style,
      ]}>
      {carregando ? (
        <ActivityIndicator color={cor} />
      ) : (
        <>
          {icone ? <Icone nome={icone} tamanho={16} cor={cor} /> : null}
          <ThemedText style={[styles.textoBotao, { color: cor }]}>{titulo}</ThemedText>
        </>
      )}
    </Pressable>
  );
}

/** Botão redondo só com ícone (voltar, conta, adicionar…). */
export function BotaoCircular({
  icone,
  rotulo,
  onPress,
  tamanho = 36,
  tom = 'acento',
}: {
  icone: NomeIcone;
  rotulo: string;
  onPress: () => void;
  tamanho?: number;
  tom?: 'acento' | 'superficie';
}) {
  const theme = useTheme();
  const acento = tom === 'acento';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={rotulo}
      hitSlop={6}
      onPress={onPress}
      style={({ pressed }) => [
        styles.circulo,
        {
          width: tamanho,
          height: tamanho,
          backgroundColor: acento
            ? pressed
              ? theme.accent200
              : theme.accent100
            : pressed
              ? theme.border
              : theme.backgroundElement,
        },
      ]}>
      <Icone nome={icone} tamanho={tamanho * 0.45} cor={acento ? theme.accent700 : theme.text} />
    </Pressable>
  );
}

type CampoProps = TextInputProps & { rotulo: string; erro?: string | null };

export function Campo({ rotulo, erro, style, multiline, ...props }: CampoProps) {
  const theme = useTheme();
  return (
    <View style={{ gap: 5 }}>
      <ThemedText type="label">{rotulo}</ThemedText>
      <TextInput
        placeholderTextColor={theme.textFaint}
        cursorColor={theme.primary}
        selectionColor={theme.primary}
        multiline={multiline}
        style={[
          styles.input,
          {
            color: theme.text,
            backgroundColor: theme.backgroundElement,
            borderColor: erro ? theme.danger : theme.border,
            minHeight: multiline ? 90 : 40,
            borderRadius: multiline ? Radius.md + 4 : Radius.pill,
            paddingVertical: multiline ? Spacing.two : 6,
            textAlignVertical: multiline ? 'top' : 'center',
          },
          style,
        ]}
        {...props}
      />
      {erro ? (
        <ThemedText type="small" style={{ color: theme.danger }}>
          {erro}
        </ThemedText>
      ) : null}
    </View>
  );
}

/** Campos lado a lado, dividindo a largura igualmente. */
export function Linha({ children }: { children: ReactNode }) {
  return (
    <View style={styles.linha}>
      {Children.map(children, (filho) => (filho ? <View style={{ flex: 1 }}>{filho}</View> : null))}
    </View>
  );
}

/** Controle segmentado em pílula (ex.: espécie, sexo). */
export function Segmentado<T extends string>({
  rotulo,
  opcoes,
  valor,
  onChange,
  permitirVazio = false,
}: {
  rotulo?: string;
  opcoes: readonly { valor: T; rotulo: string }[];
  valor: T | null;
  onChange: (v: T | null) => void;
  permitirVazio?: boolean;
}) {
  const theme = useTheme();
  return (
    <View style={{ gap: 5 }}>
      {rotulo ? <ThemedText type="label">{rotulo}</ThemedText> : null}
      <View style={[styles.seg, { borderColor: theme.border }]} accessibilityRole="radiogroup">
        {opcoes.map((o, i) => {
          const ativo = o.valor === valor;
          return (
            <Pressable
              key={o.valor}
              accessibilityRole="radio"
              accessibilityState={{ selected: ativo }}
              onPress={() => onChange(ativo && permitirVazio ? null : o.valor)}
              style={({ pressed }) => [
                styles.segOpcao,
                i > 0 && { borderLeftWidth: 1, borderLeftColor: theme.border },
                { backgroundColor: ativo ? theme.primary : pressed ? theme.pressed : 'transparent' },
              ]}>
              <ThemedText type="small" numberOfLines={1} style={{ color: ativo ? theme.onPrimary : theme.text }}>
                {o.rotulo}
              </ThemedText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

type TomCartao = 'superficie' | 'acento' | 'acento2';

const FUNDO_CARTAO: Record<TomCartao, string> = {
  superficie: Colors.backgroundElement,
  acento: Colors.accent100,
  acento2: Colors.accent2_100,
};

export function Cartao({
  children,
  onPress,
  style,
  tom = 'superficie',
  elevado = true,
  rotulo,
}: {
  children: ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  tom?: TomCartao;
  elevado?: boolean;
  rotulo?: string;
}) {
  const estilo = [styles.cartao, { backgroundColor: FUNDO_CARTAO[tom] }, elevado && styles.elevado, style];
  if (!onPress) return <View style={estilo}>{children}</View>;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={rotulo}
      onPress={onPress}
      style={({ pressed }) => [estilo, pressed && { opacity: 0.8 }]}>
      {children}
    </Pressable>
  );
}

type TomTag = 'acento' | 'acento2' | 'neutro' | 'contorno';

export function Tag({ texto, tom = 'neutro', style }: { texto: string; tom?: TomTag; style?: ViewStyle }) {
  const theme = useTheme();
  const cores: Record<TomTag, { fundo: string; texto: string }> = {
    acento: { fundo: theme.accent100, texto: theme.accent800 },
    acento2: { fundo: theme.accent2_100, texto: theme.accent2_800 },
    neutro: { fundo: theme.neutral100, texto: theme.neutral800 },
    contorno: { fundo: 'transparent', texto: theme.primary },
  };
  const c = cores[tom];
  return (
    <View
      style={[
        styles.tag,
        { backgroundColor: c.fundo },
        tom === 'contorno' && { borderWidth: 1, borderColor: theme.primary },
        style,
      ]}>
      <ThemedText style={[styles.textoTag, { color: c.texto }]}>{texto}</ThemedText>
    </View>
  );
}

/** Barra de progresso fina (0–1). */
export function Progresso({ valor, tom = 'acento' }: { valor: number; tom?: 'acento' | 'acento2' }) {
  const theme = useTheme();
  const acento = tom === 'acento';
  const pct = Math.max(0, Math.min(1, valor)) * 100;
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(pct) }}
      style={[styles.trilho, { backgroundColor: acento ? theme.accent200 : theme.accent2_100 }]}>
      <View style={{ width: `${pct}%`, height: '100%', backgroundColor: acento ? theme.primary : theme.accent2 }} />
    </View>
  );
}

/** Título de seção (h4 do sistema) com ação opcional à direita. */
export function Secao({ titulo, direita, children }: { titulo: string; direita?: ReactNode; children: ReactNode }) {
  return (
    <View style={{ gap: Spacing.two }}>
      <View style={styles.tituloSecao}>
        <ThemedText type="subtitle">{titulo}</ThemedText>
        {direita}
      </View>
      {children}
    </View>
  );
}

export function Mensagem({ texto, tipo = 'erro' }: { texto: string | null; tipo?: 'erro' | 'sucesso' }) {
  const theme = useTheme();
  if (!texto) return null;
  return (
    <ThemedText type="small" style={{ color: tipo === 'erro' ? theme.danger : theme.success }}>
      {texto}
    </ThemedText>
  );
}

export function Carregando() {
  const theme = useTheme();
  return (
    <View style={[styles.centro, { backgroundColor: theme.background }]}>
      <ActivityIndicator color={theme.primary} size="large" />
    </View>
  );
}

const styles = StyleSheet.create({
  largura: { width: '100%', maxWidth: MaxContentWidth, alignSelf: 'center' },
  rolagem: { flexGrow: 1 },
  conteudo: {
    flex: 1,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: Margem,
    paddingTop: Spacing.one,
    paddingBottom: Spacing.five,
    gap: Spacing.four,
  },
  cabecalho: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingHorizontal: Margem,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.three,
  },
  botao: {
    minHeight: 46,
    flexDirection: 'row',
    gap: 6,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: 'transparent',
    paddingHorizontal: Spacing.four,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textoBotao: { fontFamily: Fonts.heading, fontSize: 15, lineHeight: 19 },
  circulo: { borderRadius: Radius.pill, alignItems: 'center', justifyContent: 'center' },
  input: {
    borderWidth: 1,
    paddingHorizontal: 14,
    fontFamily: Fonts.body,
    fontSize: 14,
  },
  linha: { flexDirection: 'row', gap: Spacing.three, alignItems: 'flex-start' },
  seg: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: Radius.pill,
    overflow: 'hidden',
    minHeight: 40,
  },
  segOpcao: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10, paddingVertical: 7 },
  cartao: { borderRadius: Radius.cartao, padding: Spacing.three + 2, gap: Spacing.two },
  elevado: { boxShadow: Sombra.sm },
  tag: { alignSelf: 'flex-start', borderRadius: Radius.pill, paddingHorizontal: 10, paddingVertical: 3 },
  textoTag: { fontFamily: Fonts.body, fontSize: 11, lineHeight: 15, letterSpacing: 0.2 },
  trilho: { height: 6, borderRadius: Radius.pill, overflow: 'hidden' },
  tituloSecao: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  centro: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.four },
});
