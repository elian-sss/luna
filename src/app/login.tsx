import { Link } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useState } from 'react';
import { View } from 'react-native';

import { Icone } from '@/components/icone';
import { ThemedText } from '@/components/themed-text';
import { Botao, Campo, Mensagem, Tela } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useSessao } from '@/context/sessao';
import { useTheme } from '@/hooks/use-theme';
import { CONTAS_DEMO, garantirDemo, type PapelDemo } from '@/services/demo';

export default function LoginScreen() {
  const theme = useTheme();
  const { entrar } = useSessao();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const db = useSQLiteContext();
  const [demo, setDemo] = useState<PapelDemo | null>(null);

  async function onDemo(papel: PapelDemo) {
    setErro(null);
    setDemo(papel);
    try {
      await garantirDemo(db);
      await entrar(CONTAS_DEMO[papel].email, CONTAS_DEMO[papel].senha);
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível preparar a demonstração.');
      setDemo(null);
    }
  }

  async function onEntrar() {
    setErro(null);
    setEnviando(true);
    try {
      await entrar(email, senha);
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível entrar.');
      setEnviando(false);
    }
  }

  return (
    <Tela>
      <View style={{ flex: 1, justifyContent: 'center', gap: Spacing.four, paddingTop: Spacing.six }}>
        <View style={{ gap: Spacing.two, marginBottom: Spacing.four }}>
          <View
            style={{
              width: 84,
              height: 84,
              borderRadius: 42,
              backgroundColor: theme.accent100,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: Spacing.two,
            }}>
            <Icone nome="pata" tamanho={38} cor={theme.accent700} />
          </View>
          <ThemedText type="display">Luna</ThemedText>
          <ThemedText themeColor="textSecondary">Os cuidados do seu pet, organizados e compartilhados.</ThemedText>
        </View>

        <Campo
          rotulo="E-mail"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          placeholder="voce@email.com"
        />
        <Campo
          rotulo="Senha"
          value={senha}
          onChangeText={setSenha}
          secureTextEntry
          autoComplete="password"
          onSubmitEditing={onEntrar}
        />
        <Mensagem texto={erro} />
        <Botao titulo="Entrar" onPress={onEntrar} carregando={enviando} desabilitado={!!demo} />

        <Link href="/cadastro" style={{ alignSelf: 'center', padding: Spacing.two }}>
          <ThemedText type="small" style={{ color: theme.accent700 }}>
            Não tem conta? <ThemedText type="smallBold" style={{ color: theme.accent700 }}>Criar conta</ThemedText>
          </ThemedText>
        </Link>

        <View style={{ gap: Spacing.two, marginTop: Spacing.two }}>
          <ThemedText type="kicker" style={{ textAlign: 'center' }}>
            Demonstração
          </ThemedText>
          <Botao
            titulo="Entrar como tutor"
            icone="pata"
            variante="secundario"
            onPress={() => onDemo('tutor')}
            carregando={demo === 'tutor'}
            desabilitado={enviando || demo === 'cuidador'}
          />
          <Botao
            titulo="Entrar como cuidador"
            icone="usuario"
            variante="secundario"
            onPress={() => onDemo('cuidador')}
            carregando={demo === 'cuidador'}
            desabilitado={enviando || demo === 'tutor'}
          />
          <ThemedText type="caption" style={{ textAlign: 'center' }}>
            Raylane é a tutora do Thor e da Mel; Maria está cuidando deles nesta semana.
          </ThemedText>
        </View>
      </View>
    </Tela>
  );
}
