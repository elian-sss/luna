import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';

import { PetForm } from '@/components/pet-form';
import { Cabecalho, Tela } from '@/components/ui';
import { useUsuario } from '@/context/sessao';
import { criarPet } from '@/repositories/pet';
import { salvarRotina } from '@/repositories/rotina';

export default function NovoPetScreen() {
  const db = useSQLiteContext();
  const usuario = useUsuario();

  return (
    <Tela cabecalho={<Cabecalho titulo="Novo pet" />}>
      <PetForm
        tituloBotao="Salvar pet"
        onSalvar={async (dados, rotina) => {
          const pet = await criarPet(db, usuario.id, dados);
          await salvarRotina(db, pet.id, rotina);
          router.replace({ pathname: '/pet/[id]', params: { id: pet.id } });
        }}
      />
    </Tela>
  );
}
