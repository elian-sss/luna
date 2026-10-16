import type { SQLiteDatabase } from 'expo-sqlite';

import type { Usuario, UsuarioComSenha } from '@/db/types';
import { agoraISO } from '@/utils/datas';
import { novoId } from '@/utils/id';

const COLUNAS = 'id, nome, email, telefone, criado_em';

export type NovoUsuario = {
  nome: string;
  email: string;
  telefone?: string | null;
  senha_hash: string;
  salt: string;
};

export async function criarUsuario(db: SQLiteDatabase, dados: NovoUsuario): Promise<Usuario> {
  const usuario: Usuario = {
    id: novoId(),
    nome: dados.nome.trim(),
    email: dados.email.trim().toLowerCase(),
    telefone: dados.telefone?.trim() || null,
    criado_em: agoraISO(),
  };
  await db.runAsync(
    `INSERT INTO usuario (id, nome, email, senha_hash, salt, telefone, criado_em)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    usuario.id,
    usuario.nome,
    usuario.email,
    dados.senha_hash,
    dados.salt,
    usuario.telefone,
    usuario.criado_em
  );
  return usuario;
}

export function buscarUsuarioPorId(db: SQLiteDatabase, id: string) {
  return db.getFirstAsync<Usuario>(`SELECT ${COLUNAS} FROM usuario WHERE id = ?`, id);
}

export function buscarUsuarioPorEmail(db: SQLiteDatabase, email: string) {
  return db.getFirstAsync<Usuario>(
    `SELECT ${COLUNAS} FROM usuario WHERE email = ?`,
    email.trim().toLowerCase()
  );
}

/** Uso exclusivo do serviço de autenticação. */
export function buscarCredenciais(db: SQLiteDatabase, email: string) {
  return db.getFirstAsync<UsuarioComSenha>(
    `SELECT * FROM usuario WHERE email = ?`,
    email.trim().toLowerCase()
  );
}

export function listarUsuarios(db: SQLiteDatabase) {
  return db.getAllAsync<Usuario>(`SELECT ${COLUNAS} FROM usuario ORDER BY nome`);
}
