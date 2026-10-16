import type { SQLiteDatabase } from 'expo-sqlite';

import type { Atividade, Medicamento, TipoAtividade } from '@/db/types';
import { agoraISO } from '@/utils/datas';
import { novoId } from '@/utils/id';

/**
 * Rotina do pet (etapa 2): atividades diárias (alimentação, passeio…) e medicamentos,
 * com check-in por dia em REGISTRO_ATIVIDADE / REGISTRO_MEDICAMENTO.
 * Cada item tem um horário; "ração às 08:00 e às 18:00" são dois itens.
 */

export type Categoria = TipoAtividade | 'medicamento';
export type Origem = 'atividade' | 'medicamento';

/** Item da rotina como o formulário do pet o edita. `id` null = ainda não salvo. */
export type ItemRotina = {
  id: string | null;
  categoria: Categoria;
  titulo: string;
  detalhe: string | null;
  horario: string | null;
  /** Só medicamentos: período do tratamento ('YYYY-MM-DD'). */
  inicio: string | null;
  fim: string | null;
};

/** Tarefa de um dia: um item da rotina + o check-in daquele dia, se houver. */
export type Tarefa = {
  id: string;
  origem: Origem;
  categoria: Categoria;
  titulo: string;
  detalhe: string | null;
  horario: string | null;
  id_pet: string;
  nome_pet: string;
  feito_em: string | null;
  feito_por: string | null;
};

const porHorario = (a: { horario: string | null }, b: { horario: string | null }) =>
  (a.horario ?? '99:99').localeCompare(b.horario ?? '99:99');

export async function listarRotinaDoPet(db: SQLiteDatabase, idPet: string): Promise<ItemRotina[]> {
  const atividades = await db.getAllAsync<Atividade>(
    `SELECT * FROM atividade WHERE id_pet = ? AND ativo = 1`,
    idPet
  );
  const medicamentos = await db.getAllAsync<Medicamento>(`SELECT * FROM medicamento WHERE id_pet = ?`, idPet);

  return [
    ...atividades.map<ItemRotina>((a) => ({
      id: a.id,
      categoria: a.tipo,
      titulo: a.titulo,
      detalhe: a.descricao,
      horario: a.horario,
      inicio: null,
      fim: null,
    })),
    ...medicamentos.map<ItemRotina>((m) => ({
      id: m.id,
      categoria: 'medicamento',
      titulo: m.nome,
      detalhe: m.dosagem,
      horario: m.horario,
      inicio: m.inicio,
      fim: m.fim,
    })),
  ].sort(porHorario);
}

/**
 * Grava a rotina do pet a partir da lista editada no formulário.
 * Atividades removidas são desativadas (o histórico de check-ins continua);
 * medicamentos removidos são apagados.
 */
export async function salvarRotina(db: SQLiteDatabase, idPet: string, itens: ItemRotina[]) {
  const agora = agoraISO();
  await db.withTransactionAsync(async () => {
    const atividadesAtuais = new Set(
      (await db.getAllAsync<{ id: string }>(`SELECT id FROM atividade WHERE id_pet = ? AND ativo = 1`, idPet)).map(
        (r) => r.id
      )
    );
    const medicamentosAtuais = new Set(
      (await db.getAllAsync<{ id: string }>(`SELECT id FROM medicamento WHERE id_pet = ?`, idPet)).map((r) => r.id)
    );
    const mantidos = new Set<string>();

    for (const item of itens) {
      if (item.categoria === 'medicamento') {
        if (item.id && medicamentosAtuais.has(item.id)) {
          mantidos.add(item.id);
          await db.runAsync(
            `UPDATE medicamento SET nome = ?, dosagem = ?, horario = ?, inicio = ?, fim = ? WHERE id = ?`,
            item.titulo,
            item.detalhe,
            item.horario,
            item.inicio,
            item.fim,
            item.id
          );
        } else {
          await db.runAsync(
            `INSERT INTO medicamento (id, id_pet, nome, dosagem, horario, inicio, fim, criado_em)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            novoId(),
            idPet,
            item.titulo,
            item.detalhe,
            item.horario,
            item.inicio,
            item.fim,
            agora
          );
        }
      } else if (item.id && atividadesAtuais.has(item.id)) {
        mantidos.add(item.id);
        await db.runAsync(
          `UPDATE atividade SET tipo = ?, titulo = ?, descricao = ?, horario = ? WHERE id = ?`,
          item.categoria,
          item.titulo,
          item.detalhe,
          item.horario,
          item.id
        );
      } else {
        await db.runAsync(
          `INSERT INTO atividade (id, id_pet, tipo, titulo, descricao, horario, frequencia, ativo, criado_em)
           VALUES (?, ?, ?, ?, ?, ?, 'diaria', 1, ?)`,
          novoId(),
          idPet,
          item.categoria,
          item.titulo,
          item.detalhe,
          item.horario,
          agora
        );
      }
    }

    for (const id of atividadesAtuais) {
      if (!mantidos.has(id)) await db.runAsync(`UPDATE atividade SET ativo = 0 WHERE id = ?`, id);
    }
    for (const id of medicamentosAtuais) {
      if (!mantidos.has(id)) await db.runAsync(`DELETE FROM medicamento WHERE id = ?`, id);
    }
  });
}

const marcadores = (n: number) => Array(n).fill('?').join(', ');

/**
 * Tarefas de `data` ('YYYY-MM-DD'): atividades ativas dos pets em `idsAtividades`
 * e medicamentos em tratamento nessa data dos pets em `idsMedicamentos`.
 */
export async function listarTarefasDoDia(
  db: SQLiteDatabase,
  data: string,
  idsAtividades: string[],
  idsMedicamentos: string[]
): Promise<Tarefa[]> {
  const tarefas: Tarefa[] = [];

  if (idsAtividades.length) {
    tarefas.push(
      ...(await db.getAllAsync<Tarefa>(
        `SELECT a.id, 'atividade' AS origem, a.tipo AS categoria, a.titulo, a.descricao AS detalhe, a.horario,
                a.id_pet, p.nome AS nome_pet, r.realizado_em AS feito_em, u.nome AS feito_por
           FROM atividade a
           JOIN pet p ON p.id = a.id_pet
           LEFT JOIN registro_atividade r ON r.id_atividade = a.id AND r.data = ?
           LEFT JOIN usuario u ON u.id = r.id_usuario
          WHERE a.ativo = 1 AND a.id_pet IN (${marcadores(idsAtividades.length)})`,
        data,
        ...idsAtividades
      ))
    );
  }

  if (idsMedicamentos.length) {
    tarefas.push(
      ...(await db.getAllAsync<Tarefa>(
        `SELECT m.id, 'medicamento' AS origem, 'medicamento' AS categoria, m.nome AS titulo, m.dosagem AS detalhe,
                m.horario, m.id_pet, p.nome AS nome_pet, r.realizado_em AS feito_em, u.nome AS feito_por
           FROM medicamento m
           JOIN pet p ON p.id = m.id_pet
           LEFT JOIN registro_medicamento r ON r.id_medicamento = m.id AND r.data = ?
           LEFT JOIN usuario u ON u.id = r.id_usuario
          WHERE m.id_pet IN (${marcadores(idsMedicamentos.length)})
            AND (m.inicio IS NULL OR m.inicio <= ?) AND (m.fim IS NULL OR m.fim >= ?)`,
        data,
        ...idsMedicamentos,
        data,
        data
      ))
    );
  }

  return tarefas.sort((a, b) => porHorario(a, b) || a.nome_pet.localeCompare(b.nome_pet));
}

export async function marcarTarefa(db: SQLiteDatabase, origem: Origem, id: string, idUsuario: string, data: string) {
  const tabela = origem === 'atividade' ? 'registro_atividade' : 'registro_medicamento';
  const coluna = origem === 'atividade' ? 'id_atividade' : 'id_medicamento';
  await db.runAsync(
    `INSERT OR IGNORE INTO ${tabela} (id, ${coluna}, id_usuario, data, realizado_em) VALUES (?, ?, ?, ?, ?)`,
    novoId(),
    id,
    idUsuario,
    data,
    agoraISO()
  );
}

export async function desmarcarTarefa(db: SQLiteDatabase, origem: Origem, id: string, data: string) {
  const tabela = origem === 'atividade' ? 'registro_atividade' : 'registro_medicamento';
  const coluna = origem === 'atividade' ? 'id_atividade' : 'id_medicamento';
  await db.runAsync(`DELETE FROM ${tabela} WHERE ${coluna} = ? AND data = ?`, id, data);
}
