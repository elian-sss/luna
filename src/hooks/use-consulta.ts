import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Executa uma consulta assíncrona sempre que a tela ganha foco
 * (assim a lista atualiza ao voltar de um formulário) ou quando `deps` mudam.
 */
export function useConsulta<T>(consulta: () => Promise<T>, deps: unknown[]) {
  const [dados, setDados] = useState<T | null>(null);
  const [carregando, setCarregando] = useState(true);

  const consultaRef = useRef(consulta);
  useEffect(() => {
    consultaRef.current = consulta;
  });

  const recarregar = useCallback(async () => {
    setCarregando(true);
    try {
      setDados(await consultaRef.current());
    } finally {
      setCarregando(false);
    }
  }, []);

  const chave = JSON.stringify(deps);
  useFocusEffect(
    useCallback(() => {
      recarregar();
      // `chave` força nova consulta quando os parâmetros (ex.: id do pet) mudam
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [recarregar, chave])
  );

  return { dados, carregando, recarregar };
}
