import type { SQLiteDatabase } from 'expo-sqlite';

const CHAVE = 'sessao_usuario_id';

export async function lerSessao(db: SQLiteDatabase): Promise<string | null> {
  const row = await db.getFirstAsync<{ valor: string | null }>(
    `SELECT valor FROM app_kv WHERE chave = ?`,
    CHAVE
  );
  return row?.valor ?? null;
}

export async function salvarSessao(db: SQLiteDatabase, idUsuario: string) {
  await db.runAsync(
    `INSERT INTO app_kv (chave, valor) VALUES (?, ?)
     ON CONFLICT(chave) DO UPDATE SET valor = excluded.valor`,
    CHAVE,
    idUsuario
  );
}

export async function limparSessao(db: SQLiteDatabase) {
  await db.runAsync(`DELETE FROM app_kv WHERE chave = ?`, CHAVE);
}
