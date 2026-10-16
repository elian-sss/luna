import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { StyleSheet, View } from 'react-native';

import { Icone, type NomeIcone } from '@/components/icone';
import { PetAvatar } from '@/components/pet-avatar';
import { ThemedText } from '@/components/themed-text';
import { Botao, BotaoCircular, Carregando, Cartao, Progresso, Secao, Tag, Tela } from '@/components/ui';
import { Margem, Spacing } from '@/constants/theme';
import { useUsuario } from '@/context/sessao';
import type { Pet } from '@/db/types';
import { useConsulta } from '@/hooks/use-consulta';
import { useTheme } from '@/hooks/use-theme';
import { listarPetsCompartilhados, listarPetsDoTutor, type PetCompartilhado } from '@/repositories/pet';
import type { Categoria } from '@/repositories/rotina';
import { carregarTarefasDoDia, contarTarefas, type TarefaDoDia } from '@/services/rotina';
import { diasEntre, hojeISO, idadeDe, isoParaBR } from '@/utils/datas';

export default function HomeScreen() {
  const db = useSQLiteContext();
  const usuario = useUsuario();
  const theme = useTheme();

  const { dados, carregando } = useConsulta(
    async () => ({
      meus: await listarPetsDoTutor(db, usuario.id),
      compartilhados: await listarPetsCompartilhados(db, usuario.id),
      tarefas: await carregarTarefasDoDia(db, usuario.id),
    }),
    [db, usuario.id]
  );

  if (carregando && !dados) return <Carregando />;
  const { meus = [], compartilhados = [], tarefas = [] } = dados ?? {};

  return (
    <Tela
      cabecalho={
        <View style={styles.topo}>
          <View>
            <ThemedText type="label" themeColor="textSecondary">
              Olá,
            </ThemedText>
            <ThemedText type="title" style={{ fontSize: 24, lineHeight: 28 }}>
              {usuario.nome.split(' ')[0]}
            </ThemedText>
          </View>
          <BotaoCircular icone="usuario" rotulo="Minha conta" tamanho={40} onPress={() => router.push('/conta')} />
        </View>
      }>
      {compartilhados.length ? <EstadiaAtiva pets={compartilhados} /> : null}

      <Secao titulo="Seus pets">
        <View style={styles.grade}>
          {meus.map((pet) => (
            <CartaoPet key={pet.id} pet={pet} tarefas={tarefas} />
          ))}
          <Cartao
            onPress={() => router.push('/pet/novo')}
            rotulo="Adicionar pet"
            style={[styles.cartaoPet, { justifyContent: 'center' }]}>
            <View style={[styles.iconeAdicionar, { backgroundColor: theme.accent100 }]}>
              <Icone nome="mais" tamanho={22} cor={theme.accent700} />
            </View>
            <ThemedText type="cardTitle" style={{ fontSize: 15 }}>
              Adicionar pet
            </ThemedText>
            {!meus.length ? (
              <ThemedText type="caption" style={{ textAlign: 'center' }}>
                Cadastre o primeiro e monte a rotina dele
              </ThemedText>
            ) : null}
          </Cartao>
        </View>
      </Secao>

      {compartilhados.length ? (
        <Secao titulo="Sob seus cuidados">
          <View style={styles.grade}>
            {compartilhados.map((pet) => (
              <CartaoPet key={pet.id} pet={pet} tarefas={tarefas} detalhe={`Tutor: ${pet.nome_tutor.split(' ')[0]}`} />
            ))}
          </View>
        </Secao>
      ) : null}

      {tarefas.length ? (
        <>
          <Secao titulo="Resumo de hoje">
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Contador icone="osso" rotulo="Refeições" tarefas={tarefas} categoria="alimentacao" />
              <Contador icone="pilula" rotulo="Medicamentos" tarefas={tarefas} categoria="medicamento" />
              <Contador icone="pegadas" rotulo="Passeios" tarefas={tarefas} categoria="passeio" />
            </View>
          </Secao>
          <Botao titulo="Ver rotina de hoje" onPress={() => router.push('/rotina')} />
        </>
      ) : null}
    </Tela>
  );
}

/** "Estadia ativa": período em que o usuário está cuidando de pets de outra pessoa. */
function EstadiaAtiva({ pets }: { pets: PetCompartilhado[] }) {
  const theme = useTheme();
  const inicio = pets.map((p) => p.data_inicio).sort()[0];
  const fim = pets.map((p) => p.data_fim).sort().at(-1)!;
  const totalDias = diasEntre(inicio, fim) + 1;
  const dia = Math.min(totalDias, diasEntre(inicio, hojeISO()) + 1);
  const nomes = pets.map((p) => p.nome);
  const lista = nomes.length > 1 ? `${nomes.slice(0, -1).join(', ')} e ${nomes.at(-1)}` : nomes[0];

  return (
    <Cartao tom="acento" style={{ gap: 10 }}>
      <ThemedText type="kicker">Estadia ativa</ThemedText>
      <ThemedText type="cardTitle">Você está cuidando de {lista}</ThemedText>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
        <Icone nome="calendario" tamanho={15} />
        <ThemedText type="small" style={{ opacity: 0.85 }}>
          {isoParaBR(inicio).slice(0, 5)} → {isoParaBR(fim).slice(0, 5)}
        </ThemedText>
      </View>
      <Progresso valor={dia / totalDias} />
      <ThemedText type="caption" style={{ color: theme.accent700 }}>
        Dia {dia} de {totalDias}
      </ThemedText>
    </Cartao>
  );
}

function CartaoPet({ pet, tarefas, detalhe }: { pet: Pet; tarefas: TarefaDoDia[]; detalhe?: string }) {
  const { feitas, total } = contarTarefas(tarefas.filter((t) => t.id_pet === pet.id));
  const resumo = detalhe ?? ([pet.raca, idadeDe(pet.data_nascimento)].filter(Boolean).join(' · ') || ' ');

  return (
    <Cartao
      onPress={() => router.push({ pathname: '/pet/[id]', params: { id: pet.id } })}
      rotulo={`Abrir perfil de ${pet.nome}`}
      style={styles.cartaoPet}>
      <PetAvatar fotoUri={pet.foto_uri} tamanho={56} />
      <ThemedText type="cardTitle" style={{ fontSize: 15 }} numberOfLines={1}>
        {pet.nome}
      </ThemedText>
      <ThemedText type="caption" numberOfLines={1}>
        {resumo}
      </ThemedText>
      {total ? (
        <Tag
          texto={feitas === total ? 'Tudo feito hoje' : `${feitas} de ${total} hoje`}
          tom={feitas === total ? 'acento2' : 'acento'}
          style={{ alignSelf: 'center' }}
        />
      ) : (
        <Tag texto="Sem rotina" style={{ alignSelf: 'center' }} />
      )}
    </Cartao>
  );
}

function Contador({
  icone,
  rotulo,
  tarefas,
  categoria,
}: {
  icone: NomeIcone;
  rotulo: string;
  tarefas: TarefaDoDia[];
  categoria: Categoria;
}) {
  const theme = useTheme();
  const { feitas, total } = contarTarefas(tarefas, categoria);
  return (
    <Cartao style={styles.contador}>
      <Icone nome={icone} tamanho={18} cor={theme.accent700} />
      <ThemedText type="cardTitle" style={{ fontSize: 16, lineHeight: 20 }}>
        {total ? `${feitas}/${total}` : '—'}
      </ThemedText>
      <ThemedText type="caption" style={{ fontSize: 10 }} numberOfLines={1}>
        {rotulo}
      </ThemedText>
    </Cartao>
  );
}

const styles = StyleSheet.create({
  topo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Margem,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.four,
  },
  grade: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  cartaoPet: { flexBasis: '40%', flexGrow: 1, alignItems: 'center', gap: 8 },
  iconeAdicionar: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  contador: { flex: 1, alignItems: 'center', gap: 6, paddingVertical: 12, paddingHorizontal: 8 },
});
