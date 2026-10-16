import type { SQLiteDatabase } from 'expo-sqlite';

import { listarPetsCompartilhados, listarPetsDoTutor } from '@/repositories/pet';
import { listarTarefasDoDia, type Categoria, type Tarefa } from '@/repositories/rotina';
import { carregarAcesso } from '@/services/acesso';
import { hojeISO } from '@/utils/datas';

export type TarefaDoDia = Tarefa & { podeMarcar: boolean };

/**
 * Tarefas de hoje que o usuário pode ver — de um pet (`idPet`) ou de todos os pets
 * dele e dos compartilhados com ele. As permissões vêm de services/acesso.ts:
 * ver_rotina libera as atividades, ver_medicamentos os medicamentos, marcar_atividade o check-in.
 */
export async function carregarTarefasDoDia(
  db: SQLiteDatabase,
  idUsuario: string,
  idPet?: string,
  data = hojeISO()
): Promise<TarefaDoDia[]> {
  const idsPets = idPet
    ? [idPet]
    : [
        ...(await listarPetsDoTutor(db, idUsuario)).map((p) => p.id),
        ...(await listarPetsCompartilhados(db, idUsuario)).map((p) => p.id),
      ];

  const idsAtividades: string[] = [];
  const idsMedicamentos: string[] = [];
  const podeMarcar = new Set<string>();

  for (const id of new Set(idsPets)) {
    const acesso = await carregarAcesso(db, idUsuario, id);
    if (acesso.pode('ver_rotina')) idsAtividades.push(id);
    if (acesso.pode('ver_medicamentos')) idsMedicamentos.push(id);
    if (acesso.pode('marcar_atividade')) podeMarcar.add(id);
  }

  const tarefas = await listarTarefasDoDia(db, data, idsAtividades, idsMedicamentos);
  return tarefas.map((t) => ({ ...t, podeMarcar: podeMarcar.has(t.id_pet) }));
}

/** Contagem "feitas de total" para o "Resumo de hoje". */
export function contarTarefas(tarefas: Tarefa[], categoria?: Categoria) {
  const filtradas = categoria ? tarefas.filter((t) => t.categoria === categoria) : tarefas;
  return { feitas: filtradas.filter((t) => t.feito_em).length, total: filtradas.length };
}
