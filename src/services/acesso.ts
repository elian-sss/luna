import type { SQLiteDatabase } from 'expo-sqlite';

import type { Compartilhamento, Permissao, Pet } from '@/db/types';
import { hojeISO } from '@/utils/datas';

/**
 * Regra central de acesso (RNF03). Toda tela que exibe ou altera dados de um pet
 * deve consultar este serviço — nenhuma tela decide acesso sozinha.
 */

export type Acao =
  | 'ver_perfil'
  | 'editar_pet'
  | 'ver_rotina'
  | 'ver_medicamentos'
  | 'marcar_atividade'
  | 'registrar_ocorrencia'
  | 'adicionar_foto'
  | 'ver_diario'
  | 'gerenciar_compartilhamento';

export type Papel = 'tutor' | 'cuidador' | null;

export type AcessoPet = {
  papel: Papel;
  pode: (acao: Acao) => boolean;
};

const SEM_ACESSO: AcessoPet = { papel: null, pode: () => false };

/** Ações que dependem de uma coluna da tabela PERMISSAO. */
const ACOES_COM_PERMISSAO: Partial<Record<Acao, keyof Permissao>> = {
  ver_rotina: 'ver_rotina',
  ver_medicamentos: 'ver_medicamentos',
  marcar_atividade: 'marcar_atividade',
  registrar_ocorrencia: 'registrar_ocorrencia',
  adicionar_foto: 'adicionar_foto',
};

/** Ações liberadas a qualquer cuidador com acesso vigente. */
const ACOES_CUIDADOR_BASE: Acao[] = ['ver_perfil', 'ver_diario'];

export function compartilhamentoVigente(c: Pick<Compartilhamento, 'status' | 'data_inicio' | 'data_fim'>, hoje = hojeISO()) {
  return c.status === 'ativo' && c.data_inicio <= hoje && c.data_fim >= hoje;
}

export function montarAcesso(
  idUsuario: string,
  pet: Pick<Pet, 'id_usuario'>,
  compartilhamento: Compartilhamento | null,
  permissao: Permissao | null,
  hoje = hojeISO()
): AcessoPet {
  if (pet.id_usuario === idUsuario) return { papel: 'tutor', pode: () => true };

  if (!compartilhamento || !permissao || compartilhamento.id_cuidador !== idUsuario) return SEM_ACESSO;
  if (!compartilhamentoVigente(compartilhamento, hoje)) return SEM_ACESSO;

  return {
    papel: 'cuidador',
    pode: (acao) => {
      if (ACOES_CUIDADOR_BASE.includes(acao)) return true;
      const coluna = ACOES_COM_PERMISSAO[acao];
      return coluna ? permissao[coluna] === 1 : false;
    },
  };
}

export async function carregarAcesso(db: SQLiteDatabase, idUsuario: string, idPet: string): Promise<AcessoPet> {
  const pet = await db.getFirstAsync<Pick<Pet, 'id_usuario'>>(`SELECT id_usuario FROM pet WHERE id = ?`, idPet);
  if (!pet) return SEM_ACESSO;
  if (pet.id_usuario === idUsuario) return montarAcesso(idUsuario, pet, null, null);

  const hoje = hojeISO();
  const compartilhamento = await db.getFirstAsync<Compartilhamento>(
    `SELECT * FROM compartilhamento
      WHERE id_pet = ? AND id_cuidador = ? AND status = 'ativo' AND data_inicio <= ? AND data_fim >= ?
      ORDER BY data_fim DESC LIMIT 1`,
    idPet,
    idUsuario,
    hoje,
    hoje
  );
  if (!compartilhamento) return SEM_ACESSO;

  const permissao = await db.getFirstAsync<Permissao>(
    `SELECT * FROM permissao WHERE id_compartilhamento = ?`,
    compartilhamento.id
  );
  return montarAcesso(idUsuario, pet, compartilhamento, permissao, hoje);
}
