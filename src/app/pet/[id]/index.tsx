import { router, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { StyleSheet, View } from 'react-native';

import { Icone } from '@/components/icone';
import { PetAvatar } from '@/components/pet-avatar';
import { ESPECIES, SEXOS } from '@/components/pet-form';
import { ThemedText } from '@/components/themed-text';
import { Botao, Cabecalho, Carregando, Cartao, Tag, Tela } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useUsuario } from '@/context/sessao';
import { useConsulta } from '@/hooks/use-consulta';
import { useTheme } from '@/hooks/use-theme';
import { buscarPet, excluirPet } from '@/repositories/pet';
import type { Categoria } from '@/repositories/rotina';
import { carregarAcesso } from '@/services/acesso';
import { carregarTarefasDoDia, contarTarefas, type TarefaDoDia } from '@/services/rotina';
import { confirmar } from '@/utils/confirmar';
import { idadeDe } from '@/utils/datas';
import { apagarFoto } from '@/utils/fotos';

export default function PerfilPetScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const db = useSQLiteContext();
  const usuario = useUsuario();
  const theme = useTheme();

  const { dados, carregando } = useConsulta(
    async () => {
      const acesso = await carregarAcesso(db, usuario.id, id);
      if (!acesso.pode('ver_perfil')) return { acesso, pet: null, tarefas: [] };
      return {
        acesso,
        pet: await buscarPet(db, id),
        tarefas: await carregarTarefasDoDia(db, usuario.id, id),
      };
    },
    [db, usuario.id, id]
  );

  const cabecalho = <Cabecalho titulo="Perfil" />;

  if (carregando && !dados) return <Carregando />;

  const pet = dados?.pet;
  if (!dados || !pet) {
    return (
      <Tela cabecalho={cabecalho}>
        <ThemedText>Pet não encontrado ou seu acesso a ele expirou.</ThemedText>
      </Tela>
    );
  }

  const { acesso, tarefas } = dados;
  const especie = ESPECIES.find((e) => e.valor === pet.especie)?.rotulo ?? pet.especie;
  const sexo = SEXOS.find((s) => s.valor === pet.sexo)?.rotulo;
  const idade = idadeDe(pet.data_nascimento);
  const peso = pet.peso != null ? `${String(pet.peso).replace('.', ',')} kg` : null;
  const hoje = contarTarefas(tarefas);
  const verRotina = acesso.pode('ver_rotina') || acesso.pode('ver_medicamentos');

  async function onExcluir() {
    if (!pet) return;
    const ok = await confirmar(
      'Excluir pet',
      `Excluir ${pet.nome} e todo o histórico de cuidados? Essa ação não pode ser desfeita.`,
      'Excluir'
    );
    if (!ok) return;
    await excluirPet(db, pet.id);
    apagarFoto(pet.foto_uri);
    router.back();
  }

  return (
    <Tela cabecalho={cabecalho}>
      <View style={{ alignItems: 'center', gap: Spacing.two, paddingTop: 6 }}>
        <PetAvatar fotoUri={pet.foto_uri} tamanho={92} />
        <ThemedText type="title">{pet.nome}</ThemedText>
        <View style={styles.tags}>
          {[especie, pet.raca, sexo, idade, peso].filter(Boolean).map((t) => (
            <Tag key={t} texto={t!} />
          ))}
        </View>
        {acesso.papel === 'cuidador' ? <Tag texto="Você está cuidando deste pet" tom="acento2" /> : null}
      </View>

      {verRotina ? (
        <View style={{ gap: 10 }}>
          <View style={styles.grade}>
            <Resumo
              kicker="Hoje"
              titulo={hoje.total ? `${hoje.feitas} de ${hoje.total}` : 'Sem rotina'}
              corpo={hoje.total ? 'tarefas concluídas' : 'Cadastre na edição do pet'}
            />
            <ResumoCategoria kicker="Medicamentos" tarefas={tarefas} categoria="medicamento" vazio="Nenhum hoje" />
          </View>
          <View style={styles.grade}>
            <ResumoCategoria kicker="Alimentação" tarefas={tarefas} categoria="alimentacao" vazio="Não definida" />
            <ResumoCategoria kicker="Passeios" tarefas={tarefas} categoria="passeio" vazio="Não definidos" />
          </View>
        </View>
      ) : null}

      {pet.observacoes ? (
        <Cartao tom="acento" elevado={false} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
          <View style={{ marginTop: 2 }}>
            <Icone nome="alerta" tamanho={16} cor={theme.accent700} />
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <ThemedText type="kicker" style={{ color: theme.accent700 }}>
              Cuidados especiais
            </ThemedText>
            <ThemedText type="small" style={{ color: theme.accent800 }}>
              {pet.observacoes}
            </ThemedText>
          </View>
        </Cartao>
      ) : null}

      <View style={{ gap: Spacing.two }}>
        {verRotina && tarefas.length ? (
          <Botao
            titulo="Ver rotina de hoje"
            onPress={() => router.push({ pathname: '/rotina', params: { pet: pet.id } })}
          />
        ) : null}
        {acesso.pode('editar_pet') ? (
          <>
            <Botao
              titulo="Editar informações"
              icone="editar"
              variante="secundario"
              onPress={() => router.push({ pathname: '/pet/[id]/editar', params: { id: pet.id } })}
            />
            <Botao titulo="Excluir pet" icone="lixeira" variante="perigo" onPress={onExcluir} />
          </>
        ) : null}
      </View>
    </Tela>
  );
}

function Resumo({ kicker, titulo, corpo }: { kicker: string; titulo: string; corpo: string }) {
  return (
    <Cartao style={{ flex: 1, gap: 4 }}>
      <ThemedText type="kicker">{kicker}</ThemedText>
      <ThemedText type="cardTitle" style={{ fontSize: 15, lineHeight: 19 }}>
        {titulo}
      </ThemedText>
      <ThemedText type="small" style={{ opacity: 0.8 }} numberOfLines={2}>
        {corpo}
      </ThemedText>
    </Cartao>
  );
}

/** "200g · 2x ao dia" a partir das tarefas de hoje de uma categoria. */
function ResumoCategoria({
  kicker,
  tarefas,
  categoria,
  vazio,
}: {
  kicker: string;
  tarefas: TarefaDoDia[];
  categoria: Categoria;
  vazio: string;
}) {
  const doTipo = tarefas.filter((t) => t.categoria === categoria);
  if (!doTipo.length) return <Resumo kicker={kicker} titulo={vazio} corpo="—" />;

  const titulo =
    categoria === 'medicamento'
      ? `${doTipo.length} ${doTipo.length === 1 ? 'ativo' : 'ativos'}`
      : `${doTipo.length}x ao dia`;
  const primeiro = doTipo[0];
  const corpo =
    categoria === 'medicamento'
      ? [primeiro.titulo, primeiro.horario].filter(Boolean).join(' · ')
      : lista(doTipo.map((t) => t.horario).filter((h): h is string => !!h)) || primeiro.titulo;

  return <Resumo kicker={kicker} titulo={titulo} corpo={corpo} />;
}

/** ['08:00', '12:00', '18:00'] → '08:00, 12:00 e 18:00' */
function lista(itens: string[]) {
  return itens.length <= 1 ? (itens[0] ?? '') : `${itens.slice(0, -1).join(', ')} e ${itens.at(-1)}`;
}

const styles = StyleSheet.create({
  tags: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 6 },
  grade: { flexDirection: 'row', gap: 10 },
});
