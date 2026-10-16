import type { SQLiteDatabase } from 'expo-sqlite';

/**
 * Migrations controladas por PRAGMA user_version.
 * Para alterar o schema: adicione um novo item ao array (nunca edite um já publicado).
 *
 * Ids são UUID (TEXT) para facilitar a futura sincronização com a API.
 * Datas: 'YYYY-MM-DD'; horários: 'HH:MM'; data/hora: ISO 8601.
 */
const MIGRATIONS: string[] = [
  // v1 — schema inicial (modelo de dados do documento + ajustes)
  `
  CREATE TABLE usuario (
    id          TEXT PRIMARY KEY NOT NULL,
    nome        TEXT NOT NULL,
    email       TEXT NOT NULL UNIQUE COLLATE NOCASE,
    senha_hash  TEXT NOT NULL,
    salt        TEXT NOT NULL,
    telefone    TEXT,
    criado_em   TEXT NOT NULL
  );

  CREATE TABLE pet (
    id              TEXT PRIMARY KEY NOT NULL,
    id_usuario      TEXT NOT NULL REFERENCES usuario(id) ON DELETE CASCADE,
    nome            TEXT NOT NULL,
    especie         TEXT NOT NULL,
    raca            TEXT,
    sexo            TEXT CHECK (sexo IN ('macho', 'femea')),
    data_nascimento TEXT,
    peso            REAL,
    observacoes     TEXT,
    foto_uri        TEXT,
    criado_em       TEXT NOT NULL
  );
  CREATE INDEX idx_pet_usuario ON pet(id_usuario);

  CREATE TABLE atividade (
    id          TEXT PRIMARY KEY NOT NULL,
    id_pet      TEXT NOT NULL REFERENCES pet(id) ON DELETE CASCADE,
    titulo      TEXT NOT NULL,
    descricao   TEXT,
    horario     TEXT,
    frequencia  TEXT NOT NULL DEFAULT 'diaria',
    ativo       INTEGER NOT NULL DEFAULT 1,
    criado_em   TEXT NOT NULL
  );
  CREATE INDEX idx_atividade_pet ON atividade(id_pet);

  CREATE TABLE registro_atividade (
    id            TEXT PRIMARY KEY NOT NULL,
    id_atividade  TEXT NOT NULL REFERENCES atividade(id) ON DELETE CASCADE,
    id_usuario    TEXT NOT NULL REFERENCES usuario(id),
    data          TEXT NOT NULL,
    realizado_em  TEXT NOT NULL,
    observacao    TEXT,
    UNIQUE (id_atividade, data)
  );

  CREATE TABLE medicamento (
    id          TEXT PRIMARY KEY NOT NULL,
    id_pet      TEXT NOT NULL REFERENCES pet(id) ON DELETE CASCADE,
    nome        TEXT NOT NULL,
    dosagem     TEXT,
    horario     TEXT,
    inicio      TEXT,
    fim         TEXT,
    instrucoes  TEXT,
    criado_em   TEXT NOT NULL
  );
  CREATE INDEX idx_medicamento_pet ON medicamento(id_pet);

  CREATE TABLE registro_medicamento (
    id              TEXT PRIMARY KEY NOT NULL,
    id_medicamento  TEXT NOT NULL REFERENCES medicamento(id) ON DELETE CASCADE,
    id_usuario      TEXT NOT NULL REFERENCES usuario(id),
    data            TEXT NOT NULL,
    realizado_em    TEXT NOT NULL,
    observacao      TEXT,
    UNIQUE (id_medicamento, data)
  );

  CREATE TABLE compartilhamento (
    id           TEXT PRIMARY KEY NOT NULL,
    id_pet       TEXT NOT NULL REFERENCES pet(id) ON DELETE CASCADE,
    id_cuidador  TEXT NOT NULL REFERENCES usuario(id) ON DELETE CASCADE,
    data_inicio  TEXT NOT NULL,
    data_fim     TEXT NOT NULL,
    status       TEXT NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'encerrado', 'revogado')),
    criado_em    TEXT NOT NULL
  );
  CREATE INDEX idx_compartilhamento_cuidador ON compartilhamento(id_cuidador);

  CREATE TABLE permissao (
    id                    TEXT PRIMARY KEY NOT NULL,
    id_compartilhamento   TEXT NOT NULL UNIQUE REFERENCES compartilhamento(id) ON DELETE CASCADE,
    ver_rotina            INTEGER NOT NULL DEFAULT 1,
    ver_medicamentos      INTEGER NOT NULL DEFAULT 1,
    marcar_atividade      INTEGER NOT NULL DEFAULT 1,
    registrar_ocorrencia  INTEGER NOT NULL DEFAULT 1,
    adicionar_foto        INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE ocorrencia (
    id               TEXT PRIMARY KEY NOT NULL,
    id_pet           TEXT NOT NULL REFERENCES pet(id) ON DELETE CASCADE,
    id_usuario       TEXT NOT NULL REFERENCES usuario(id),
    tipo             TEXT NOT NULL,
    descricao        TEXT NOT NULL,
    data_hora        TEXT NOT NULL,
    tutor_informado  INTEGER NOT NULL DEFAULT 0
  );
  CREATE INDEX idx_ocorrencia_pet ON ocorrencia(id_pet);

  CREATE TABLE diario (
    id          TEXT PRIMARY KEY NOT NULL,
    id_pet      TEXT NOT NULL REFERENCES pet(id) ON DELETE CASCADE,
    id_usuario  TEXT NOT NULL REFERENCES usuario(id),
    tipo        TEXT NOT NULL,
    descricao   TEXT,
    foto_uri    TEXT,
    data_hora   TEXT NOT NULL
  );
  CREATE INDEX idx_diario_pet ON diario(id_pet);

  -- Chave/valor local (ex.: sessão do usuário logado)
  CREATE TABLE app_kv (
    chave  TEXT PRIMARY KEY NOT NULL,
    valor  TEXT
  );
  `,

  // v2 — categoria da atividade (ícone e "Resumo de hoje": alimentação, passeio, outro)
  `
  ALTER TABLE atividade ADD COLUMN tipo TEXT NOT NULL DEFAULT 'outro';
  CREATE INDEX idx_registro_atividade_data ON registro_atividade(data);
  CREATE INDEX idx_registro_medicamento_data ON registro_medicamento(data);
  `,
];

export async function migrateDbIfNeeded(db: SQLiteDatabase) {
  await db.execAsync(`PRAGMA journal_mode = 'wal'; PRAGMA foreign_keys = ON;`);

  const result = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const currentVersion = result?.user_version ?? 0;

  for (let v = currentVersion; v < MIGRATIONS.length; v++) {
    await db.withTransactionAsync(async () => {
      await db.execAsync(MIGRATIONS[v]);
    });
    await db.execAsync(`PRAGMA user_version = ${v + 1}`);
  }
}
