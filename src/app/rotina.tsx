import { useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Icone } from '@/components/icone';
import { tituloDoItem } from '@/components/rotina';
import { ThemedText } from '@/components/themed-text';
import { Cabecalho, Carregando, Cartao, Mensagem, Progresso, Tela } from '@/components/ui';
import { Fonts, Radius } from '@/constants/theme';
import { useUsuario } from '@/context/sessao';
import { useConsulta } from '@/hooks/use-consulta';
import { useTheme } from '@/hooks/use-theme';
import { desmarcarTarefa, marcarTarefa } from '@/repositories/rotina';
import { carregarTarefasDoDia, contarTarefas, type TarefaDoDia } from '@/services/rotina';
import { diaPorExtenso, duracao, hojeISO, horaDe, minutosDe } from '@/utils/datas';

/** Checklist do dia (US de rotina): todos os pets visíveis ou só um (`?pet=<id>`). */
export default function RotinaScreen() {
  const { pet: idPet } = useLocalSearchParams<{ pet?: string }>();
  const db = useSQLiteContext();
  const usuario = useUsuario();
  const [erro, setErro] = useState<string | null>(null);

  const { dados: tarefas, carregando, recarregar } = useConsulta(
    () => carregarTarefasDoDia(db, usuario.id, idPet),
    [db, usuario.id, idPet]
  );

  async function alternar(t: TarefaDoDia) {
    setErro(null);
    try {
      if (t.feito_em) await desmarcarTarefa(db, t.origem, t.id, hojeISO());
      else await marcarTarefa(db, t.origem, t.id, usuario.id, hojeISO());
      await recarregar();
    } catch {
      setErro('Não foi possível atualizar a tarefa.');
    }
  }

  const nomePet = idPet ? tarefas?.[0]?.nome_pet : undefined;
  const cabecalho = (
    <Cabecalho
      titulo={nomePet ? `Hoje · ${nomePet}` : 'Hoje'}
      subtitulo={diaPorExtenso()}
      direita={<ChipUsuario nome={usuario.nome} />}
    />
  );

  if (carregando && !tarefas) return <Carregando />;

  const { feitas, total } = contarTarefas(tarefas ?? []);
  const agora = minutosDe(horaDe());

  return (
    <Tela cabecalho={cabecalho}>
      {total ? (
        <>
          <View style={{ gap: 6 }}>
            <View style={styles.linhaProgresso}>
              <ThemedText type="label">Tarefas concluídas</ThemedText>
              <ThemedText type="smallBold" themeColor="accent2_700" style={{ fontSize: 12 }}>
                {feitas} de {total}
              </ThemedText>
            </View>
            <Progresso valor={feitas / total} tom="acento2" />
          </View>

          <Mensagem texto={erro} />

          <View style={{ gap: 8 }}>
            {tarefas!.map((t) => (
              <ItemTarefa
                key={`${t.origem}-${t.id}`}
                tarefa={t}
                agora={agora}
                mostrarPet={!idPet}
                nomeUsuario={usuario.nome}
                onPress={() => alternar(t)}
              />
            ))}
          </View>
        </>
      ) : (
        <Cartao>
          <ThemedText type="cardTitle">Nada para hoje</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Quando a rotina de um pet tiver refeições, passeios ou medicamentos, eles aparecem aqui para marcar como
            feitos.
          </ThemedText>
        </Cartao>
      )}
    </Tela>
  );
}

function ItemTarefa({
  tarefa: t,
  agora,
  mostrarPet,
  nomeUsuario,
  onPress,
}: {
  tarefa: TarefaDoDia;
  agora: number;
  mostrarPet: boolean;
  nomeUsuario: string;
  onPress: () => void;
}) {
  const theme = useTheme();
  const feita = !!t.feito_em;
  const atraso = !feita && t.horario ? agora - minutosDe(t.horario) : 0;
  const atrasada = atraso > 0;

  const status = feita
    ? `Concluído às ${horaDe(t.feito_em)}${t.feito_por && t.feito_por !== nomeUsuario ? ` por ${t.feito_por.split(' ')[0]}` : ''}`
    : atrasada
      ? `Atrasado em ${duracao(atraso)}`
      : 'Pendente';
  const corStatus = feita ? theme.accent2_700 : atrasada ? theme.accent700 : theme.textSecondary;

  return (
    <Cartao
      tom={atrasada ? 'acento' : 'superficie'}
      onPress={t.podeMarcar ? onPress : undefined}
      rotulo={`${tituloDoItem(t)}, ${status}`}
      style={styles.item}>
      {feita ? (
        <View style={[styles.marcador, { backgroundColor: theme.accent2 }]}>
          <Icone nome="check" tamanho={16} cor={theme.neutral100} espessura={3} />
        </View>
      ) : atrasada ? (
        <View style={[styles.marcador, { backgroundColor: theme.primary }]}>
          <Icone nome="alerta" tamanho={16} cor={theme.onPrimary} />
        </View>
      ) : (
        <View style={[styles.marcador, { borderWidth: 2, borderColor: theme.border }]} />
      )}
      <View style={{ flex: 1 }}>
        <ThemedText type="small">
          {t.horario ?? 'Ao longo do dia'} · {tituloDoItem(t)}
        </ThemedText>
        <ThemedText type="caption" style={{ color: corStatus }}>
          {mostrarPet ? `${t.nome_pet} · ` : ''}
          {status}
        </ThemedText>
      </View>
    </Cartao>
  );
}

/** "(M) Maria" — quem está marcando as tarefas neste aparelho. */
function ChipUsuario({ nome }: { nome: string }) {
  const theme = useTheme();
  const primeiro = nome.split(' ')[0];
  return (
    <View style={[styles.chip, { backgroundColor: theme.backgroundElement }]}>
      <View style={[styles.inicial, { backgroundColor: theme.accent100 }]}>
        <ThemedText style={{ fontFamily: Fonts.heading, fontSize: 12, lineHeight: 15, color: theme.accent700 }}>
          {primeiro.charAt(0).toUpperCase()}
        </ThemedText>
      </View>
      <ThemedText type="small" style={{ fontSize: 12 }}>
        {primeiro}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  linhaProgresso: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  item: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, paddingHorizontal: 12 },
  marcador: {
    width: 36,
    height: 36,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 5,
    paddingLeft: 5,
    paddingRight: 10,
    borderRadius: Radius.pill,
  },
  inicial: { width: 24, height: 24, borderRadius: Radius.pill, alignItems: 'center', justifyContent: 'center' },
});
