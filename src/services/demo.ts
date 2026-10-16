import type { SQLiteDatabase } from 'expo-sqlite';

import { criarCompartilhamento, temCompartilhamentoVigente } from '@/repositories/compartilhamento';
import { criarPet, listarPetsDoTutor } from '@/repositories/pet';
import { listarTarefasDoDia, marcarTarefa, salvarRotina, type ItemRotina } from '@/repositories/rotina';
import { buscarUsuarioPorEmail } from '@/repositories/usuario';
import { cadastrar } from '@/services/auth';
import { hojeISO } from '@/utils/datas';

/**
 * Contas de demonstração (apresentação da disciplina): a tutora Raylane, dona do Thor e da Mel,
 * e a cuidadora Maria, que está com os dois numa estadia em andamento.
 */
export const CONTAS_DEMO = {
  tutor: { nome: 'Raylane Demo', email: 'tutor@luna.demo', senha: 'demo123' },
  cuidador: { nome: 'Maria Demo', email: 'cuidador@luna.demo', senha: 'demo123' },
} as const;

export type PapelDemo = keyof typeof CONTAS_DEMO;

/** Data relativa a hoje ('YYYY-MM-DD'). */
const dia = (deslocamento: number) => {
  const d = new Date();
  d.setDate(d.getDate() + deslocamento);
  return hojeISO(d);
};

const anosAtras = (anos: number) => {
  const d = new Date();
  d.setFullYear(d.getFullYear() - anos);
  d.setMonth(d.getMonth() - 2);
  return hojeISO(d);
};

const item = (
  categoria: ItemRotina['categoria'],
  titulo: string,
  detalhe: string | null,
  horario: string,
  periodo?: [string, string]
): ItemRotina => ({
  id: null,
  categoria,
  titulo,
  detalhe,
  horario,
  inicio: periodo?.[0] ?? null,
  fim: periodo?.[1] ?? null,
});

/**
 * Garante que as contas e os dados de demonstração existam neste aparelho.
 * Idempotente: só cria o que falta, e renova a estadia se a anterior já venceu.
 */
export async function garantirDemo(db: SQLiteDatabase) {
  const tutor =
    (await buscarUsuarioPorEmail(db, CONTAS_DEMO.tutor.email)) ?? (await cadastrar(db, CONTAS_DEMO.tutor));
  const cuidador =
    (await buscarUsuarioPorEmail(db, CONTAS_DEMO.cuidador.email)) ?? (await cadastrar(db, CONTAS_DEMO.cuidador));

  let pets = await listarPetsDoTutor(db, tutor.id);
  if (!pets.length) {
    const thor = await criarPet(db, tutor.id, {
      nome: 'Thor',
      especie: 'cao',
      raca: 'Labrador',
      sexo: 'macho',
      data_nascimento: anosAtras(5),
      peso: 28,
      observacoes: 'Não deixar o Thor sair pelo portão sozinho. Fica ansioso quando passa muito tempo sozinho.',
      foto_uri: null,
    });
    await salvarRotina(db, thor.id, [
      item('passeio', 'Passeio', 'quarteirão', '07:00'),
      item('alimentacao', 'Ração', '200g', '08:00'),
      item('medicamento', 'Anti-inflamatório', '1 comprimido', '14:00', [dia(-2), dia(3)]),
      item('alimentacao', 'Ração', '200g', '18:00'),
      item('passeio', 'Passeio', 'pracinha', '18:30'),
    ]);

    const mel = await criarPet(db, tutor.id, {
      nome: 'Mel',
      especie: 'cao',
      raca: 'SRD',
      sexo: 'femea',
      data_nascimento: anosAtras(3),
      peso: 12.5,
      observacoes: 'Alérgica a frango. Não dar petiscos de frango.',
      foto_uri: null,
    });
    await salvarRotina(db, mel.id, [
      item('alimentacao', 'Ração hipoalergênica', '150g', '08:00'),
      item('medicamento', 'Vitamina', '5 gotas', '09:00', [dia(-2), dia(10)]),
      item('outro', 'Escovar o pelo', null, '16:00'),
      item('alimentacao', 'Ração hipoalergênica', '150g', '18:00'),
    ]);

    pets = await listarPetsDoTutor(db, tutor.id);

    // Algumas tarefas da manhã já feitas pela cuidadora, para o checklist não começar vazio.
    const hoje = hojeISO();
    const tarefas = await listarTarefasDoDia(db, hoje, [thor.id, mel.id], [thor.id, mel.id]);
    for (const t of tarefas.filter((t) => t.horario && t.horario <= '08:00')) {
      await marcarTarefa(db, t.origem, t.id, cuidador.id, hoje);
    }
  }

  // Estadia: começou há 2 dias e vai até daqui a 7 (renovada se a anterior venceu).
  for (const pet of pets) {
    if (await temCompartilhamentoVigente(db, pet.id, cuidador.id, hojeISO())) continue;
    await criarCompartilhamento(db, pet.id, cuidador.id, dia(-2), dia(7), {
      ver_rotina: 1,
      ver_medicamentos: 1,
      marcar_atividade: 1,
      registrar_ocorrencia: 1,
      adicionar_foto: 1,
    });
  }
}
