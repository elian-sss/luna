/** Tipos das linhas do banco (espelham src/db/migrations.ts). */

export type Usuario = {
  id: string;
  nome: string;
  email: string;
  telefone: string | null;
  criado_em: string;
};

export type UsuarioComSenha = Usuario & {
  senha_hash: string;
  salt: string;
};

export type Sexo = 'macho' | 'femea';

export type Pet = {
  id: string;
  id_usuario: string;
  nome: string;
  especie: string;
  raca: string | null;
  sexo: Sexo | null;
  data_nascimento: string | null;
  peso: number | null;
  observacoes: string | null;
  foto_uri: string | null;
  criado_em: string;
};

export type TipoAtividade = 'alimentacao' | 'passeio' | 'outro';

export type Atividade = {
  id: string;
  id_pet: string;
  tipo: TipoAtividade;
  titulo: string;
  descricao: string | null;
  horario: string | null;
  frequencia: string;
  ativo: number;
  criado_em: string;
};

export type Medicamento = {
  id: string;
  id_pet: string;
  nome: string;
  dosagem: string | null;
  horario: string | null;
  inicio: string | null;
  fim: string | null;
  instrucoes: string | null;
  criado_em: string;
};

export type StatusCompartilhamento = 'ativo' | 'encerrado' | 'revogado';

export type Compartilhamento = {
  id: string;
  id_pet: string;
  id_cuidador: string;
  data_inicio: string;
  data_fim: string;
  status: StatusCompartilhamento;
  criado_em: string;
};

export type Permissao = {
  id: string;
  id_compartilhamento: string;
  ver_rotina: number;
  ver_medicamentos: number;
  marcar_atividade: number;
  registrar_ocorrencia: number;
  adicionar_foto: number;
};
