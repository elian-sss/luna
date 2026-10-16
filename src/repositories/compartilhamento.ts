import type { SQLiteDatabase } from 'expo-sqlite';

import type { Permissao } from '@/db/types';
import { agoraISO } from '@/utils/datas';
import { novoId } from '@/utils/id';

export type PermissoesCompartilhamento = Omit<Permissao, 'id' | 'id_compartilhamento'>;

/** Compartilha um pet com um cuidador no período informado ('YYYY-MM-DD'). */
export async function criarCompartilhamento(
  db: SQLiteDatabase,
  idPet: string,
  idCuidador: string,
  dataInicio: string,
  dataFim: string,
  permissoes: PermissoesCompartilhamento
) {
  const id = novoId();
  await db.withTransactionAsync(async () => {
    await db.runAsync(
      `INSERT INTO compartilhamento (id, id_pet, id_cuidador, data_inicio, data_fim, status, criado_em)
       VALUES (?, ?, ?, ?, ?, 'ativo', ?)`,
      id,
      idPet,
      idCuidador,
      dataInicio,
      dataFim,
      agoraISO()
    );
    await db.runAsync(
      `INSERT INTO permissao (id, id_compartilhamento, ver_rotina, ver_medicamentos, marcar_atividade,
                              registrar_ocorrencia, adicionar_foto)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      novoId(),
      id,
      permissoes.ver_rotina,
      permissoes.ver_medicamentos,
      permissoes.marcar_atividade,
      permissoes.registrar_ocorrencia,
      permissoes.adicionar_foto
    );
  });
  return id;
}

/** Existe compartilhamento ativo do pet com o cuidador cobrindo `hoje`? */
export async function temCompartilhamentoVigente(db: SQLiteDatabase, idPet: string, idCuidador: string, hoje: string) {
  const row = await db.getFirstAsync<{ n: number }>(
    `SELECT COUNT(*) AS n FROM compartilhamento
      WHERE id_pet = ? AND id_cuidador = ? AND status = 'ativo' AND data_inicio <= ? AND data_fim >= ?`,
    idPet,
    idCuidador,
    hoje,
    hoje
  );
  return (row?.n ?? 0) > 0;
}
