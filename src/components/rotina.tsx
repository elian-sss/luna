import { useState } from 'react';
import { View } from 'react-native';

import { Icone, type NomeIcone } from '@/components/icone';
import { ThemedText } from '@/components/themed-text';
import { Botao, BotaoCircular, Campo, Cartao, Linha, Mensagem, Secao, Segmentado } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { Categoria, ItemRotina } from '@/repositories/rotina';
import { brParaISO, horaValida, isoParaBR, mascaraData, mascaraHora } from '@/utils/datas';

export const CATEGORIAS: { valor: Categoria; rotulo: string; icone: NomeIcone }[] = [
  { valor: 'alimentacao', rotulo: 'Refeição', icone: 'osso' },
  { valor: 'medicamento', rotulo: 'Remédio', icone: 'pilula' },
  { valor: 'passeio', rotulo: 'Passeio', icone: 'pegadas' },
  { valor: 'outro', rotulo: 'Outro', icone: 'relogio' },
];

export const iconeDaCategoria = (c: Categoria) => CATEGORIAS.find((x) => x.valor === c)?.icone ?? 'relogio';

/** "Ração · 200g" */
export const tituloDoItem = (i: Pick<ItemRotina, 'titulo' | 'detalhe'>) =>
  [i.titulo, i.detalhe].filter(Boolean).join(' · ');

/** "14:00 · 10/09 → 15/09" */
function quandoDoItem(i: ItemRotina) {
  const periodo =
    i.inicio || i.fim ? `${i.inicio ? isoParaBR(i.inicio).slice(0, 5) : '…'} → ${i.fim ? isoParaBR(i.fim).slice(0, 5) : '…'}` : null;
  return [i.horario ?? 'Sem horário', periodo].filter(Boolean).join(' · ');
}

/** Lista editável da rotina do pet (seção "Rotina" do cadastro). */
export function EditorRotina({ itens, onChange }: { itens: ItemRotina[]; onChange: (itens: ItemRotina[]) => void }) {
  const theme = useTheme();
  const [editando, setEditando] = useState<number | 'novo' | null>(null);

  function salvar(item: ItemRotina) {
    const novos = editando === 'novo' ? [...itens, item] : itens.map((x, i) => (i === editando ? item : x));
    onChange(novos.sort((a, b) => (a.horario ?? '99:99').localeCompare(b.horario ?? '99:99')));
    setEditando(null);
  }

  return (
    <Secao
      titulo="Rotina"
      direita={
        editando === null ? (
          <BotaoCircular icone="mais" rotulo="Adicionar item à rotina" tamanho={30} onPress={() => setEditando('novo')} />
        ) : null
      }>
      {itens.length === 0 && editando === null ? (
        <ThemedText type="small" themeColor="textSecondary">
          Adicione as refeições, passeios e medicamentos do dia. Quem cuidar do pet marca cada um como feito.
        </ThemedText>
      ) : null}

      {itens.map((item, i) =>
        editando === i ? (
          <FormItem key={item.id ?? `novo-${i}`} inicial={item} onSalvar={salvar} onCancelar={() => setEditando(null)} />
        ) : (
          <Cartao
            key={item.id ?? `novo-${i}`}
            onPress={editando === null ? () => setEditando(i) : undefined}
            rotulo={`Editar ${item.titulo}`}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, paddingHorizontal: 14 }}>
            <Icone nome={iconeDaCategoria(item.categoria)} tamanho={16} cor={theme.accent700} />
            <View style={{ flex: 1 }}>
              <ThemedText type="small">{tituloDoItem(item)}</ThemedText>
              <ThemedText type="caption">{quandoDoItem(item)}</ThemedText>
            </View>
            <BotaoCircular
              icone="fechar"
              rotulo={`Remover ${item.titulo}`}
              tamanho={28}
              tom="superficie"
              onPress={() => onChange(itens.filter((_, j) => j !== i))}
            />
          </Cartao>
        )
      )}

      {editando === 'novo' ? <FormItem onSalvar={salvar} onCancelar={() => setEditando(null)} /> : null}
    </Secao>
  );
}

function FormItem({
  inicial,
  onSalvar,
  onCancelar,
}: {
  inicial?: ItemRotina;
  onSalvar: (item: ItemRotina) => void;
  onCancelar: () => void;
}) {
  const [categoria, setCategoria] = useState<Categoria>(inicial?.categoria ?? 'alimentacao');
  const [titulo, setTitulo] = useState(inicial?.titulo ?? '');
  const [detalhe, setDetalhe] = useState(inicial?.detalhe ?? '');
  const [horario, setHorario] = useState(inicial?.horario ?? '');
  const [inicio, setInicio] = useState(isoParaBR(inicial?.inicio));
  const [fim, setFim] = useState(isoParaBR(inicial?.fim));
  const [erro, setErro] = useState<string | null>(null);
  const medicamento = categoria === 'medicamento';

  function confirmar() {
    setErro(null);
    if (!titulo.trim()) return setErro(medicamento ? 'Informe o nome do medicamento.' : 'Informe o que fazer.');
    if (horario && !horaValida(horario)) return setErro('Horário inválido (HH:MM).');

    let inicioISO: string | null = null;
    let fimISO: string | null = null;
    if (medicamento) {
      if (inicio.trim() && !(inicioISO = brParaISO(inicio))) return setErro('Data de início inválida (DD/MM/AAAA).');
      if (fim.trim() && !(fimISO = brParaISO(fim))) return setErro('Data de fim inválida (DD/MM/AAAA).');
      if (inicioISO && fimISO && fimISO < inicioISO) return setErro('O fim do tratamento é antes do início.');
    }

    onSalvar({
      id: inicial?.id ?? null,
      categoria,
      titulo: titulo.trim(),
      detalhe: detalhe.trim() || null,
      horario: horario || null,
      inicio: inicioISO,
      fim: fimISO,
    });
  }

  return (
    <Cartao tom="acento" elevado={false} style={{ gap: Spacing.three }}>
      <Segmentado opcoes={CATEGORIAS} valor={categoria} onChange={(c) => c && setCategoria(c)} />
      <Campo
        rotulo={medicamento ? 'Medicamento *' : 'O que fazer *'}
        value={titulo}
        onChangeText={setTitulo}
        placeholder={medicamento ? 'Ex.: Vermífugo' : categoria === 'passeio' ? 'Ex.: Passeio no quarteirão' : 'Ex.: Ração'}
      />
      <Linha>
        <Campo
          rotulo={medicamento ? 'Dose' : 'Detalhe'}
          value={detalhe}
          onChangeText={setDetalhe}
          placeholder={medicamento ? '1 comprimido' : '200g'}
        />
        <Campo
          rotulo="Horário"
          value={horario}
          onChangeText={(t) => setHorario(mascaraHora(t))}
          placeholder="08:00"
          keyboardType="number-pad"
        />
      </Linha>
      {medicamento ? (
        <Linha>
          <Campo
            rotulo="Início"
            value={inicio}
            onChangeText={(t) => setInicio(mascaraData(t))}
            placeholder="DD/MM/AAAA"
            keyboardType="number-pad"
          />
          <Campo
            rotulo="Fim"
            value={fim}
            onChangeText={(t) => setFim(mascaraData(t))}
            placeholder="DD/MM/AAAA"
            keyboardType="number-pad"
          />
        </Linha>
      ) : null}
      <Mensagem texto={erro} />
      <Linha>
        <Botao titulo="Cancelar" variante="secundario" onPress={onCancelar} />
        <Botao titulo={inicial ? 'Atualizar' : 'Adicionar'} onPress={confirmar} />
      </Linha>
    </Cartao>
  );
}
