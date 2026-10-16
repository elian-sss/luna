import type { SQLiteDatabase } from 'expo-sqlite';

import type { Pet } from '@/db/types';
import { agoraISO, hojeISO } from '@/utils/datas';
import { novoId } from '@/utils/id';

export type DadosPet = Omit<Pet, 'id' | 'id_usuario' | 'criado_em'>;

export type PetCompartilhado = Pet & {
  id_compartilhamento: string;
  data_inicio: string;
  data_fim: string;
  nome_tutor: string;
};

export async function criarPet(db: SQLiteDatabase, idUsuario: string, dados: DadosPet): Promise<Pet> {
  const pet: Pet = { ...dados, id: novoId(), id_usuario: idUsuario, criado_em: agoraISO() };
  await db.runAsync(
    `INSERT INTO pet (id, id_usuario, nome, especie, raca, sexo, data_nascimento, peso, observacoes, foto_uri, criado_em)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    pet.id,
    pet.id_usuario,
    pet.nome,
    pet.especie,
    pet.raca,
    pet.sexo,
    pet.data_nascimento,
    pet.peso,
    pet.observacoes,
    pet.foto_uri,
    pet.criado_em
  );
  return pet;
}

export async function atualizarPet(db: SQLiteDatabase, id: string, dados: DadosPet) {
  await db.runAsync(
    `UPDATE pet SET nome = ?, especie = ?, raca = ?, sexo = ?, data_nascimento = ?, peso = ?,
       observacoes = ?, foto_uri = ?
     WHERE id = ?`,
    dados.nome,
    dados.especie,
    dados.raca,
    dados.sexo,
    dados.data_nascimento,
    dados.peso,
    dados.observacoes,
    dados.foto_uri,
    id
  );
}

export async function excluirPet(db: SQLiteDatabase, id: string) {
  await db.runAsync(`DELETE FROM pet WHERE id = ?`, id);
}

export function buscarPet(db: SQLiteDatabase, id: string) {
  return db.getFirstAsync<Pet>(`SELECT * FROM pet WHERE id = ?`, id);
}

export function listarPetsDoTutor(db: SQLiteDatabase, idUsuario: string) {
  return db.getAllAsync<Pet>(`SELECT * FROM pet WHERE id_usuario = ? ORDER BY nome`, idUsuario);
}

/** Pets compartilhados com o cuidador, apenas com acesso vigente hoje. */
export function listarPetsCompartilhados(db: SQLiteDatabase, idCuidador: string) {
  const hoje = hojeISO();
  return db.getAllAsync<PetCompartilhado>(
    `SELECT p.*, c.id AS id_compartilhamento, c.data_inicio, c.data_fim, u.nome AS nome_tutor
       FROM compartilhamento c
       JOIN pet p ON p.id = c.id_pet
       JOIN usuario u ON u.id = p.id_usuario
      WHERE c.id_cuidador = ? AND c.status = 'ativo'
        AND c.data_inicio <= ? AND c.data_fim >= ?
      ORDER BY p.nome`,
    idCuidador,
    hoje,
    hoje
  );
}
