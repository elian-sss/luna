import { Caprasimo_400Regular } from '@expo-google-fonts/caprasimo';
import { Figtree_400Regular, Figtree_600SemiBold, Figtree_700Bold, useFonts } from '@expo-google-fonts/figtree';
import { DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { SQLiteProvider } from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { Carregando } from '@/components/ui';
import { Colors } from '@/constants/theme';
import { SessaoProvider, useSessao } from '@/context/sessao';
import { migrateDbIfNeeded } from '@/db/migrations';

SplashScreen.preventAutoHideAsync();

/** Fundo creme também nas transições e áreas do navegador. */
const TEMA_NAVEGACAO = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: Colors.primary,
    background: Colors.background,
    card: Colors.background,
    text: Colors.text,
    border: Colors.border,
  },
};

export default function RootLayout() {
  const [fontesProntas, erroFontes] = useFonts({
    Caprasimo_400Regular,
    Figtree_400Regular,
    Figtree_600SemiBold,
    Figtree_700Bold,
  });

  // Monta a árvore só com as fontes prontas (a splash continua visível até lá).
  // Não troque por um condicional dentro do SQLiteProvider: ele não repassa os filhos
  // atualizados e a navegação nunca montava no APK de release.
  if (!fontesProntas && !erroFontes) return null;

  return (
    <ThemeProvider value={TEMA_NAVEGACAO}>
      <SQLiteProvider databaseName="luna.db" onInit={migrateDbIfNeeded}>
        <SessaoProvider>
          <Navegacao />
        </SessaoProvider>
      </SQLiteProvider>
      <StatusBar style="dark" />
    </ThemeProvider>
  );
}

function Navegacao() {
  const { usuario, carregando } = useSessao();

  useEffect(() => {
    if (!carregando) SplashScreen.hideAsync();
  }, [carregando]);

  if (carregando) return <Carregando />;

  const logado = usuario != null;
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Colors.background } }}>
      <Stack.Protected guard={!logado}>
        <Stack.Screen name="login" />
        <Stack.Screen name="cadastro" />
      </Stack.Protected>

      <Stack.Protected guard={logado}>
        <Stack.Screen name="index" />
        <Stack.Screen name="rotina" />
        <Stack.Screen name="conta" />
        <Stack.Screen name="pet/novo" />
        <Stack.Screen name="pet/[id]/index" />
        <Stack.Screen name="pet/[id]/editar" />
      </Stack.Protected>
    </Stack>
  );
}
