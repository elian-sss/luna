import { useSQLiteContext } from 'expo-sqlite';
import { createContext, useContext, useEffect, useState, type PropsWithChildren } from 'react';

import type { Usuario } from '@/db/types';
import { lerSessao, limparSessao, salvarSessao } from '@/repositories/sessao';
import { buscarUsuarioPorId } from '@/repositories/usuario';
import * as auth from '@/services/auth';

type SessaoContexto = {
  usuario: Usuario | null;
  /** Não é limpo no logout (ver useUsuario). */
  ultimoUsuario: Usuario | null;
  carregando: boolean;
  entrar: (email: string, senha: string) => Promise<void>;
  cadastrar: (dados: auth.DadosCadastro) => Promise<void>;
  sair: () => Promise<void>;
};

const Contexto = createContext<SessaoContexto | null>(null);

export function SessaoProvider({ children }: PropsWithChildren) {
  const db = useSQLiteContext();
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [ultimoUsuario, setUltimoUsuario] = useState<Usuario | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    (async () => {
      const id = await lerSessao(db);
      const u = id ? await buscarUsuarioPorId(db, id) : null;
      setUsuario(u);
      setUltimoUsuario(u);
      setCarregando(false);
    })();
  }, [db]);

  async function iniciar(u: Usuario) {
    await salvarSessao(db, u.id);
    setUltimoUsuario(u);
    setUsuario(u);
  }

  const valor: SessaoContexto = {
    usuario,
    ultimoUsuario,
    carregando,
    entrar: async (email, senha) => iniciar(await auth.entrar(db, email, senha)),
    cadastrar: async (dados) => iniciar(await auth.cadastrar(db, dados)),
    sair: async () => {
      await limparSessao(db);
      setUsuario(null);
    },
  };

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function useSessao() {
  const ctx = useContext(Contexto);
  if (!ctx) throw new Error('useSessao deve ser usado dentro de <SessaoProvider>');
  return ctx;
}

/**
 * Usuário logado — use apenas em telas protegidas.
 * Durante o logout devolve o último usuário, enquanto as telas protegidas desmontam.
 */
export function useUsuario(): Usuario {
  const { ultimoUsuario } = useSessao();
  if (!ultimoUsuario) throw new Error('Nenhum usuário logado');
  return ultimoUsuario;
}
