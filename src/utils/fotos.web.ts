import * as ImagePicker from 'expo-image-picker';

/** Web: sem sistema de arquivos — a imagem é guardada como data URI no banco. */
export async function escolherFoto(): Promise<string | null> {
  const resultado = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.6,
    base64: true,
  });
  if (resultado.canceled) return null;

  const asset = resultado.assets[0];
  return asset.base64 ? `data:${asset.mimeType ?? 'image/jpeg'};base64,${asset.base64}` : asset.uri;
}

export function apagarFoto(_uri: string | null) {}
