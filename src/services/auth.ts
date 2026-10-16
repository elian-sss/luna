import * as Crypto from 'expo-crypto';
import type { SQLiteDatabase } from 'expo-sqlite';

import type { Usuario } from '@/db/types';
import { buscarCredenciais, buscarUsuarioPorEmail, criarUsuario } from '@/repositories/usuario';

export class AuthError extends Error {}

function gerarSalt(): string {
  return Array.from(Crypto.getRandomBytes(16), (b) => b.toString(16).padStart(2, '0')).join('');
}

function hashSenha(senha: string, salt: string) {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, `${salt}:${senha}`);
}

export type DadosCadastro = {
  nome: string;
  email: string;
  telefone?: string;
  senha: string;
};

export async function cadastrar(db: SQLiteDatabase, dados: DadosCadastro): Promise<Usuario> {
  if (!dados.nome.trim()) throw new AuthError('Informe seu nome.');
  if (!/^\S+@\S+\.\S+$/.test(dados.email.trim())) throw new AuthError('E-mail inválido.');
  if (dados.senha.length < 6) throw new AuthError('A senha deve ter pelo menos 6 caracteres.');
  if (await buscarUsuarioPorEmail(db, dados.email)) {
    throw new AuthError('Já existe uma conta com este e-mail.');
  }

  const salt = gerarSalt();
  const senha_hash = await hashSenha(dados.senha, salt);
  return criarUsuario(db, { ...dados, senha_hash, salt });
}

export async function entrar(db: SQLiteDatabase, email: string, senha: string): Promise<Usuario> {
  const credenciais = await buscarCredenciais(db, email);
  if (!credenciais || (await hashSenha(senha, credenciais.salt)) !== credenciais.senha_hash) {
    throw new AuthError('E-mail ou senha incorretos.');
  }
  const { senha_hash, salt, ...usuario } = credenciais;
  return usuario;
}
