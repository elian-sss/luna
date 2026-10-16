import { Directory, File, Paths } from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';

import { novoId } from '@/utils/id';

/**
 * Abre a galeria e devolve uma URI persistente da foto escolhida (ou null se cancelar).
 * A URI do picker é temporária, então a foto é copiada para a pasta de documentos do app.
 * (Versão web em fotos.web.ts.)
 */
export async function escolherFoto(): Promise<string | null> {
  const permissao = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permissao.granted) return null;

  const resultado = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.6,
  });
  if (resultado.canceled) return null;

  const pasta = new Directory(Paths.document, 'fotos');
  if (!pasta.exists) pasta.create();
  const destino = new File(pasta, `${novoId()}.jpg`);
  await new File(resultado.assets[0].uri).copy(destino);
  return destino.uri;
}

/** Remove uma foto salva pelo app (ignora arquivos inexistentes). */
export function apagarFoto(uri: string | null) {
  if (!uri?.startsWith('file:')) return;
  try {
    const arquivo = new File(uri);
    if (arquivo.exists) arquivo.delete();
  } catch {
    // foto já removida — nada a fazer
  }
}
