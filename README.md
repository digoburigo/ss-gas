# zen-t3-turbo

## Instalação

> [!NOTE]
>
> Certifique-se de seguir os requisitos do sistema especificados em [`package.json#engines`](./package.json#L4) antes de prosseguir.

## Sobre

Utiliza [Turborepo](https://turborepo.com) e contém:

```text
.github
  └─ workflows
        └─ CI com configuração de cache do pnpm
.vscode
  └─ Extensões e configurações recomendadas para usuários do VSCode
apps
  ├─ expo
  │   ├─ Expo SDK 54
  │   ├─ React Native 0.81 usando React 19
  │   ├─ Navegação usando Expo Router
  │   ├─ Tailwind CSS v4 usando NativeWind v5
  │   └─ Chamadas de API com tipagem segura usando tRPC
  ├─ server
  │   ├─ Elysia 1.4.15
  │   ├─ ZenStack v3
  │   └─ Better-Auth
  ├─ web
  │   ├─ Tanstack Router
  │   ├─ Tanstack Query
  │   ├─ Tanstack Table
  │   └─ ZenStack v3 (API E2E com Tipagem Segura para Server & Client)

packages
  ├─ api
  │   └─ Definição de roteador tRPC v11
  ├─ auth
  │   └─ Autenticação usando better-auth.
  ├─ email
  │   └─ Templates de email. Os emails são construídos com React Email.
  ├─ validators
  │   └─ Validação com tipagem segura usando Zod
  ├─ zen-v3
  │   └─ Schema de banco de dados e utilitários com ZenStack v3
  └─ ui
      └─ Início de um pacote de UI para a webapp usando shadcn-ui e baseui
tooling
  ├─ eslint
  │   └─ presets compartilhados e refinados do eslint
  ├─ prettier
  │   └─ configuração compartilhada do prettier
  ├─ tailwind
  │   └─ tema e configuração compartilhada do tailwind
  └─ typescript
      └─ tsconfig compartilhado que você pode estender
```

> Neste template, usamos `@acme` como um placeholder para nomes de pacotes. Como usuário, você pode querer substituí-lo pelo nome da sua organização ou projeto. Você pode usar localizar-e-substituir para alterar todas as instâncias de `@acme` para algo como `@minha-empresa` ou `@nome-do-projeto`.

## Início Rápido

> **Nota**
> O pacote [zen-v3](./packages/zen-v3) está pré-configurado para usar PostgreSQL com uma configuração local do Docker Compose. O schema do banco de dados é definido em `packages/zen-v3/schema.zmodel` usando ZenStack v3. Para iniciar o banco de dados PostgreSQL local, execute `pnpm db:start` no diretório raiz, que iniciará os serviços do Docker Compose definidos no pacote zen-v3. Se você quiser usar um provedor de banco de dados diferente, faça as modificações necessárias no [arquivo de schema](./packages/zen-v3/schema.zmodel) e atualize a configuração de conexão do banco de dados.

Para colocá-lo em execução, siga os passos abaixo:

### 1. Configurar dependências

```bash
# Instalar dependências
pnpm i

# Configurar variáveis de ambiente
# Há um arquivo `.env.example` no diretório raiz que você pode usar como referência
cp .env.example .env

# Iniciar docker compose no pacote zen-v3 para PostgreSQL local
pnpm db:start

# Enviar o schema do ZenStack v3 para o banco de dados
pnpm db:push
```

### 2. Gerar Schema do Better Auth

Este projeto usa [Better Auth](https://www.better-auth.com) para autenticação. O schema de autenticação precisa ser gerado usando a CLI do Better Auth antes que você possa usar os recursos de autenticação.

```bash
# Gerar o schema do Better Auth
pnpm --filter @acme/auth generate
```

Este comando executa a CLI do Better Auth com a seguinte configuração:

- **Arquivo de configuração**: `packages/auth/script/auth-cli.ts` - Um arquivo de configuração exclusivo para CLI (isolado do src para prevenir importações)
- É necessário criar os models manualmente no arquivo `schema.zmodel` no pacote `packages/zen-v3`

O processo de geração:

1. Lê a configuração do Better Auth de `packages/auth/script/auth-cli.ts`
2. Gera o schema de banco de dados apropriado baseado na sua configuração de autenticação

> **Nota**: O arquivo `auth-cli.ts` é colocado no diretório `script/` (ao invés de `src/`) para prevenir importações acidentais de outras partes do código. Este arquivo é exclusivamente para geração de schema via CLI e **não** deve ser usado diretamente na sua aplicação. Para autenticação em tempo de execução, use a configuração de `packages/auth/src/index.ts`.

Para mais informações sobre a CLI do Better Auth, veja a [documentação oficial](https://www.better-auth.com/docs/concepts/cli#generate).

### 3. Configurar script `dev` do Expo

#### Usar Simulador iOS

1. Certifique-se de ter o XCode e XCommand Line Tools instalados [conforme mostrado na documentação do expo](https://docs.expo.dev/workflow/ios-simulator).

   > **NOTA:** Se você acabou de instalar o XCode, ou se o atualizou, você precisa abrir o simulador manualmente uma vez. Execute `npx expo start` a partir de `apps/expo`, e então digite `I` para iniciar o Expo Go. Após a inicialização manual, você pode executar `pnpm dev` no diretório raiz.

   ```diff
   +  "dev": "expo start --ios",
   ```

2. Execute `pnpm dev` na pasta raiz do projeto.

#### Usar Emulador Android

1. Instale as ferramentas do Android Studio [conforme mostrado na documentação do expo](https://docs.expo.dev/workflow/android-studio-emulator).

2. Altere o script `dev` em `apps/expo/package.json` para abrir o emulador Android.

   ```diff
   +  "dev": "expo start --android",
   ```

3. Execute `pnpm dev` na pasta raiz do projeto.

### 4. Configurar Better-Auth para funcionar com Expo

Para fazer o Better-Auth funcionar com Expo, você deve:

#### Fazer Deploy do Auth Proxy (RECOMENDADO)

O Better-auth vem com um [plugin de proxy de autenticação](https://www.better-auth.com/docs/plugins/oauth-proxy). Ao fazer deploy do app Next.js, você pode fazer o OAuth funcionar em deployments de preview e desenvolvimento para apps Expo.

Ao usar o plugin de proxy, os apps Next.js encaminharão quaisquer requisições de autenticação para o servidor proxy, que lidará com o fluxo OAuth e então redirecionará de volta para o app Next.js. Isso facilita fazer o OAuth funcionar, pois você terá uma URL estável que é publicamente acessível e não muda a cada deployment e não depende de qual porta o app está rodando. Então, se a porta 3000 estiver ocupada e seu app Next.js iniciar na porta 3001, sua autenticação ainda funcionará sem ter que reconfigurar o provedor OAuth.

#### Adicionar seu IP local ao seu provedor OAuth

Você pode alternativamente adicionar seu IP local (ex: `192.168.x.y:$PORT`) ao seu provedor OAuth. Isso pode não ser tão confiável pois seu IP local pode mudar quando você trocar de rede. Alguns provedores OAuth também podem suportar apenas uma única URL de callback para cada app, tornando essa abordagem inviável para alguns provedores (ex: GitHub).

### 5a. Quando for hora de adicionar um novo componente de UI

Execute o script `ui-add` para adicionar um novo componente de UI usando a CLI interativa do `shadcn/ui`:

```bash
pnpm ui-add
```

Quando o(s) componente(s) for(em) instalado(s), você estará pronto para começar a usá-lo(s) em seu app.

### 5b. Quando for hora de adicionar um novo pacote

Para adicionar um novo pacote, simplesmente execute `pnpm turbo gen init` na raiz do monorepo. Isso solicitará um nome de pacote, bem como se você deseja instalar quaisquer dependências no novo pacote (é claro que você também pode fazer isso você mesmo mais tarde).

O gerador configura o `package.json`, `tsconfig.json` e um `index.ts`, além de configurar todas as configurações necessárias para ferramentas em torno do seu pacote, como formatação, linting e verificação de tipos. Quando o pacote for criado, você estará pronto para construir o pacote.

## FAQ

### Este padrão vaza código backend para minhas aplicações cliente?

Não, não vaza. O pacote `api` deve ser apenas uma dependência de produção na aplicação Next.js onde é servido. O app Expo, e todos os outros apps que você possa adicionar no futuro, devem adicionar o pacote `api` apenas como uma dependência de desenvolvimento. Isso permite que você tenha tipagem completa em suas aplicações cliente, mantendo seu código backend seguro.

Se você precisar compartilhar código em tempo de execução entre cliente e servidor, como schemas de validação de entrada, você pode criar um pacote `shared` separado para isso e importá-lo em ambos os lados.

## Deploy

### Next.js

#### Pré-requisitos

> **Nota**
> Por favor, note que a aplicação Next.js com tRPC deve ser deployada para que o app Expo possa se comunicar com o servidor em um ambiente de produção.

#### Deploy para Vercel

Vamos fazer o deploy da aplicação Next.js para a [Vercel](https://vercel.com). Se você nunca fez deploy de um app Turborepo lá, não se preocupe, os passos são bastante diretos. Você também pode ler o [guia oficial do Turborepo](https://vercel.com/docs/concepts/monorepos/turborepo) sobre deploy para Vercel.

1. Crie um novo projeto na Vercel, selecione a pasta `apps/nextjs` como diretório raiz. O sistema de configuração zero da Vercel deve lidar com todas as configurações para você.

2. Adicione sua variável de ambiente `POSTGRES_URL`.

3. Pronto! Seu app deve fazer deploy com sucesso. Atribua seu domínio e use-o ao invés de `localhost` para a `url` no app Expo para que seu app Expo possa se comunicar com seu backend quando você não estiver em desenvolvimento.

### Auth Proxy

O proxy de autenticação vem como um plugin do better-auth. Isso é necessário para que o app Next.js possa autenticar usuários em deployments de preview. O proxy de autenticação não é usado para requisições OAuth em deployments de produção. A maneira mais fácil de colocá-lo em execução é fazer deploy do app Next.js para a vercel.

### Expo

O deploy de sua aplicação Expo funciona de forma ligeiramente diferente em comparação ao Next.js na web. Em vez de "deployar" seu app online, você precisa enviar builds de produção do seu app para lojas de aplicativos, como [Apple App Store](https://www.apple.com/app-store) e [Google Play](https://play.google.com/store/apps). Você pode ler o [guia completo de distribuição do seu app](https://docs.expo.dev/distribution/introduction), incluindo melhores práticas, na documentação do Expo.

1. Certifique-se de modificar a função `getBaseUrl` para apontar para a URL de produção do seu backend:

   <https://github.com/t3-oss/create-t3-turbo/blob/656965aff7db271e5e080242c4a3ce4dad5d25f8/apps/expo/src/utils/api.tsx#L20-L37>

2. Vamos começar configurando o [EAS Build](https://docs.expo.dev/build/introduction), que é abreviação de Expo Application Services. O serviço de build ajuda você a criar builds do seu app, sem exigir uma configuração completa de desenvolvimento nativo. Os comandos abaixo são um resumo de [Criando seu primeiro build](https://docs.expo.dev/build/setup).

   ```bash
   # Instalar a CLI do EAS
   pnpm add -g eas-cli

   # Fazer login com sua conta Expo
   eas login

   # Configurar seu app Expo
   cd apps/expo
   eas build:configure
   ```

3. Após a configuração inicial, você pode criar seu primeiro build. Você pode fazer build para plataformas Android e iOS e usar diferentes [perfis de build do `eas.json`](https://docs.expo.dev/build-reference/eas-json) para criar builds de produção ou desenvolvimento, ou builds de teste. Vamos fazer um build de produção para iOS.

   ```bash
   eas build --platform ios --profile production
   ```

   > Se você não especificar a flag `--profile`, o EAS usa o perfil `production` por padrão.

4. Agora que você tem seu primeiro build de produção, você pode enviá-lo para as lojas. O [EAS Submit](https://docs.expo.dev/submit/introduction) pode ajudá-lo a enviar o build para as lojas.

   ```bash
   eas submit --platform ios --latest
   ```

   > Você também pode combinar build e submit em um único comando, usando `eas build ... --auto-submit`.

5. Antes de colocar seu app nas mãos dos seus usuários, você terá que fornecer informações adicionais para as lojas de aplicativos. Isso inclui screenshots, informações do app, políticas de privacidade, etc. _Ainda em preview_, o [EAS Metadata](https://docs.expo.dev/eas/metadata) pode ajudá-lo com a maioria dessas informações.

6. Uma vez que tudo esteja aprovado, seus usuários finalmente poderão aproveitar seu app. Digamos que você detectou um pequeno erro de digitação; você terá que criar um novo build, enviá-lo para as lojas e aguardar aprovação antes de poder resolver esse problema. Nesses casos, você pode usar o EAS Update para enviar rapidamente uma pequena correção de bug para seus usuários sem passar por esse longo processo. Vamos começar configurando o EAS Update.

   Os passos abaixo resumem o guia [Começando com EAS Update](https://docs.expo.dev/eas-update/getting-started/#configure-your-project).

   ```bash
   # Adicionar a biblioteca `expo-updates` ao seu app Expo
   cd apps/expo
   pnpm expo install expo-updates

   # Configurar EAS Update
   eas update:configure
   ```

7. Antes de podermos enviar atualizações para seu app, você tem que criar um novo build e enviá-lo para as lojas de aplicativos. Para cada mudança que inclui APIs nativas, você tem que reconstruir o app e enviar a atualização para as lojas de aplicativos. Veja os passos 2 e 3.

8. Agora que tudo está pronto para atualizações, vamos criar uma nova atualização para builds de `production`. Com a flag `--auto`, o EAS Update usa o nome da sua branch git atual e mensagem de commit para esta atualização. Veja [Como o EAS Update funciona](https://docs.expo.dev/eas-update/how-eas-update-works/#publishing-an-update) para mais informações.

   ```bash
   cd apps/expo
   eas update --auto
   ```

   > Suas atualizações OTA (Over The Air) devem sempre seguir as regras da loja de aplicativos. Você não pode alterar a funcionalidade principal do seu app sem obter aprovação da loja de aplicativos. Mas esta é uma maneira rápida de atualizar seu app para pequenas mudanças e correções de bugs.

9. Pronto! Agora que você criou seu build de produção, enviou-o para as lojas e instalou o EAS Update, você está pronto para qualquer coisa!

## Referências

A stack origina-se de [create-t3-app](https://github.com/t3-oss/create-t3-app).

Um [post de blog](https://jumr.dev/blog/t3-turbo) onde escrevi como migrar um app T3 para isso.
