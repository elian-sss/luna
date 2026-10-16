# Luna

App mobile (React Native + Expo) para gerenciar e compartilhar os cuidados de pets.
Funciona 100% offline: os dados ficam em um banco SQLite local no aparelho.

## Rodando

```bash
npm install
npx expo start        # depois: "a" (Android), "w" (web) ou escaneie o QR no Expo Go
```

## Estrutura

```
src/
  app/             telas (expo-router) — cada arquivo é uma rota
  components/      componentes de UI (ui.tsx, pet-form, pet-avatar…)
  context/         sessão do usuário logado
  db/              migrations (PRAGMA user_version) e tipos das tabelas
  repositories/    todo o SQL fica aqui — camada que a futura API vai substituir
  services/        auth (hash de senha) e acesso (regra de permissão tutor/cuidador)
  hooks/ utils/
```

## Decisões

- **Compartilhamento:** por enquanto, tutor e cuidador usam contas diferentes no mesmo aparelho.
  A sincronização entre aparelhos virá com a API.
- **Ids UUID** em todas as tabelas, para facilitar a sincronização futura.
- **Acesso:** toda tela consulta `services/acesso.ts` (`carregarAcesso(...).pode(acao)`).
- **Senha:** SHA-256 com salt aleatório (expo-crypto). Sessão salva na tabela `app_kv`.

## Alterando o banco

Adicione um novo item ao array `MIGRATIONS` em `src/db/migrations.ts`. Nunca edite uma migration já publicada.

## Gerando o APK (local, Windows)

```bash
npx expo prebuild --platform android
cd android && ./gradlew assembleRelease -PreactNativeArchitectures=arm64-v8a,armeabi-v7a
# saída: android/app/build/outputs/apk/release/app-release.apk
```

No Windows, o CMake 3.22.1 que vem no SDK traz um `ninja` antigo, que estoura o limite de 260
caracteres de caminho. Instale o `cmake;3.31.6` pelo sdkmanager e aponte para ele em
`android/local.properties`:

```
cmake.dir=C\:\Users\<usuario>\AppData\Local\Android\Sdk\cmake\3.31.6
```

O APK de release sai assinado com a chave de debug. Serve para instalar e testar, mas não para a Play Store.
