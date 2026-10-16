import { View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Botao, Cabecalho, Cartao, Tela } from '@/components/ui';
import { Fonts } from '@/constants/theme';
import { useSessao, useUsuario } from '@/context/sessao';
import { useTheme } from '@/hooks/use-theme';
import { confirmar } from '@/utils/confirmar';

export default function ContaScreen() {
  const theme = useTheme();
  const usuario = useUsuario();
  const { sair } = useSessao();

  async function onSair() {
    if (await confirmar('Sair', 'Deseja sair da sua conta neste aparelho?', 'Sair')) await sair();
  }

  return (
    <Tela cabecalho={<Cabecalho titulo="Minha conta" />}>
      <Cartao style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View
          style={{
            width: 48,
            height: 48,
            borderRadius: 24,
            backgroundColor: theme.accent2_100,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <ThemedText style={{ fontFamily: Fonts.heading, fontSize: 20, lineHeight: 24, color: theme.accent2_700 }}>
            {usuario.nome.charAt(0).toUpperCase()}
          </ThemedText>
        </View>
        <View style={{ flex: 1 }}>
          <ThemedText type="cardTitle">{usuario.nome}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {usuario.email}
          </ThemedText>
          {usuario.telefone ? (
            <ThemedText type="small" themeColor="textSecondary">
              {usuario.telefone}
            </ThemedText>
          ) : null}
        </View>
      </Cartao>
      <ThemedText type="small" themeColor="textSecondary">
        Os dados ficam salvos apenas neste aparelho. Outra pessoa pode criar uma conta aqui para cuidar dos seus pets
        quando você compartilhar o acesso.
      </ThemedText>
      <Botao titulo="Sair da conta" icone="sair" variante="secundario" onPress={onSair} />
    </Tela>
  );
}
