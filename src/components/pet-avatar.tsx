import { Image } from 'expo-image';
import { View } from 'react-native';

import { Icone } from '@/components/icone';
import { useTheme } from '@/hooks/use-theme';

/** Foto circular do pet; sem foto, mostra uma pata sobre o tom claro do acento. */
export function PetAvatar({ fotoUri, tamanho = 56 }: { fotoUri: string | null; tamanho?: number }) {
  const theme = useTheme();
  const estilo = { width: tamanho, height: tamanho, borderRadius: tamanho / 2 };

  if (fotoUri) return <Image source={{ uri: fotoUri }} style={estilo} contentFit="cover" />;

  return (
    <View style={[estilo, { backgroundColor: theme.accent100, alignItems: 'center', justifyContent: 'center' }]}>
      <Icone nome="pata" tamanho={tamanho * 0.42} cor={theme.accent700} />
    </View>
  );
}
