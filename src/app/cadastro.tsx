import { useState } from 'react';

import { ThemedText } from '@/components/themed-text';
import { Botao, Cabecalho, Campo, Mensagem, Tela } from '@/components/ui';
import { useSessao } from '@/context/sessao';

export default function CadastroScreen() {
  const { cadastrar } = useSessao();
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmacao, setConfirmacao] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function onCadastrar() {
    setErro(null);
    if (senha !== confirmacao) return setErro('As senhas não conferem.');
    setEnviando(true);
    try {
      await cadastrar({ nome, email, telefone, senha });
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível criar a conta.');
      setEnviando(false);
    }
  }

  return (
    <Tela cabecalho={<Cabecalho titulo="Criar conta" />}>
      <ThemedText type="small" themeColor="textSecondary">
        A mesma conta serve para cuidar dos seus pets e dos pets compartilhados com você.
      </ThemedText>
      <Campo rotulo="Nome *" value={nome} onChangeText={setNome} autoComplete="name" />
      <Campo
        rotulo="E-mail *"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
      />
      <Campo rotulo="Telefone" value={telefone} onChangeText={setTelefone} keyboardType="phone-pad" />
      <Campo rotulo="Senha * (mín. 6 caracteres)" value={senha} onChangeText={setSenha} secureTextEntry />
      <Campo rotulo="Confirmar senha *" value={confirmacao} onChangeText={setConfirmacao} secureTextEntry />
      <Mensagem texto={erro} />
      <Botao titulo="Criar conta" onPress={onCadastrar} carregando={enviando} />
    </Tela>
  );
}
