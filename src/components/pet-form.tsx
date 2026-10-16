import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { PetAvatar } from '@/components/pet-avatar';
import { EditorRotina } from '@/components/rotina';
import { ThemedText } from '@/components/themed-text';
import { Botao, Campo, Linha, Mensagem, Segmentado } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import type { Pet, Sexo } from '@/db/types';
import type { DadosPet } from '@/repositories/pet';
import type { ItemRotina } from '@/repositories/rotina';
import { brParaISO, hojeISO, isoParaBR, mascaraData } from '@/utils/datas';
import { escolherFoto } from '@/utils/fotos';

export const ESPECIES = [
  { valor: 'cao', rotulo: 'Cão' },
  { valor: 'gato', rotulo: 'Gato' },
  { valor: 'outro', rotulo: 'Outro' },
] as const;

export const SEXOS: { valor: Sexo; rotulo: string }[] = [
  { valor: 'macho', rotulo: 'Macho' },
  { valor: 'femea', rotulo: 'Fêmea' },
];

type Props = {
  inicial?: Pet | null;
  rotinaInicial?: ItemRotina[];
  tituloBotao: string;
  onSalvar: (dados: DadosPet, rotina: ItemRotina[]) => Promise<void>;
};

export function PetForm({ inicial, rotinaInicial = [], tituloBotao, onSalvar }: Props) {
  const [nome, setNome] = useState(inicial?.nome ?? '');
  const [especie, setEspecie] = useState<string | null>(inicial?.especie ?? null);
  const [raca, setRaca] = useState(inicial?.raca ?? '');
  const [sexo, setSexo] = useState<Sexo | null>(inicial?.sexo ?? null);
  const [nascimento, setNascimento] = useState(isoParaBR(inicial?.data_nascimento));
  const [peso, setPeso] = useState(inicial?.peso != null ? String(inicial.peso).replace('.', ',') : '');
  const [observacoes, setObservacoes] = useState(inicial?.observacoes ?? '');
  const [fotoUri, setFotoUri] = useState(inicial?.foto_uri ?? null);
  const [rotina, setRotina] = useState(rotinaInicial);
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  async function trocarFoto() {
    const uri = await escolherFoto();
    if (uri) setFotoUri(uri);
  }

  async function salvar() {
    setErro(null);
    if (!nome.trim()) return setErro('Informe o nome do pet.');
    if (!especie) return setErro('Selecione a espécie.');

    let dataNascimento: string | null = null;
    if (nascimento.trim()) {
      dataNascimento = brParaISO(nascimento);
      if (!dataNascimento || dataNascimento > hojeISO()) return setErro('Data de nascimento inválida (DD/MM/AAAA).');
    }

    let pesoNum: number | null = null;
    if (peso.trim()) {
      pesoNum = Number(peso.replace(',', '.'));
      if (!Number.isFinite(pesoNum) || pesoNum <= 0) return setErro('Peso inválido.');
    }

    setSalvando(true);
    try {
      await onSalvar(
        {
          nome: nome.trim(),
          especie,
          raca: raca.trim() || null,
          sexo,
          data_nascimento: dataNascimento,
          peso: pesoNum,
          observacoes: observacoes.trim() || null,
          foto_uri: fotoUri,
        },
        rotina
      );
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível salvar.');
      setSalvando(false);
    }
  }

  return (
    <View style={{ gap: Spacing.four }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={fotoUri ? 'Trocar foto' : 'Adicionar foto'}
        onPress={trocarFoto}
        style={{ alignItems: 'center', gap: 6 }}>
        <PetAvatar fotoUri={fotoUri} tamanho={84} />
        <ThemedText type="caption">{fotoUri ? 'Toque para trocar a foto' : 'Toque para adicionar foto'}</ThemedText>
      </Pressable>

      <Campo rotulo="Nome *" value={nome} onChangeText={setNome} placeholder="Ex.: Thor" />
      <Segmentado rotulo="Espécie *" opcoes={ESPECIES} valor={especie} onChange={setEspecie} />
      <Linha>
        <Campo rotulo="Raça" value={raca} onChangeText={setRaca} placeholder="Ex.: SRD" />
        <Campo
          rotulo="Nascimento"
          value={nascimento}
          onChangeText={(t) => setNascimento(mascaraData(t))}
          placeholder="DD/MM/AAAA"
          keyboardType="number-pad"
        />
      </Linha>
      <Linha>
        <Campo rotulo="Peso (kg)" value={peso} onChangeText={setPeso} placeholder="Ex.: 8,5" keyboardType="decimal-pad" />
        <Segmentado rotulo="Sexo" opcoes={SEXOS} valor={sexo} onChange={setSexo} permitirVazio />
      </Linha>

      <EditorRotina itens={rotina} onChange={setRotina} />

      <Campo
        rotulo="Cuidados especiais"
        value={observacoes}
        onChangeText={setObservacoes}
        placeholder="Alergias, comportamento, o que evitar…"
        multiline
      />

      <Mensagem texto={erro} />
      <Botao titulo={tituloBotao} onPress={salvar} carregando={salvando} />
    </View>
  );
}
