import { router, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';

import { PetForm } from '@/components/pet-form';
import { ThemedText } from '@/components/themed-text';
import { Cabecalho, Carregando, Tela } from '@/components/ui';
import { useUsuario } from '@/context/sessao';
import { useConsulta } from '@/hooks/use-consulta';
import { atualizarPet, buscarPet } from '@/repositories/pet';
import { listarRotinaDoPet, salvarRotina } from '@/repositories/rotina';
import { carregarAcesso } from '@/services/acesso';
import { apagarFoto } from '@/utils/fotos';

export default function EditarPetScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const db = useSQLiteContext();
  const usuario = useUsuario();

  const { dados, carregando } = useConsulta(
    async () => {
      const acesso = await carregarAcesso(db, usuario.id, id);
      if (!acesso.pode('editar_pet')) return null;
      const pet = await buscarPet(db, id);
      return pet ? { pet, rotina: await listarRotinaDoPet(db, id) } : null;
    },
    [db, usuario.id, id]
  );

  const cabecalho = <Cabecalho titulo="Editar pet" />;

  if (carregando && !dados) return <Carregando />;
  if (!dados) {
    return (
      <Tela cabecalho={cabecalho}>
        <ThemedText>Você não tem permissão para editar este pet.</ThemedText>
      </Tela>
    );
  }

  const { pet } = dados;
  return (
    <Tela cabecalho={cabecalho}>
      <PetForm
        inicial={pet}
        rotinaInicial={dados.rotina}
        tituloBotao="Salvar alterações"
        onSalvar={async (novos, rotina) => {
          await atualizarPet(db, id, novos);
          await salvarRotina(db, id, rotina);
          if (pet.foto_uri !== novos.foto_uri) apagarFoto(pet.foto_uri);
          router.back();
        }}
      />
    </Tela>
  );
}
