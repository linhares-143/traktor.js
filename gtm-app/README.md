# Tags de Conversão · GTM

Aplicação web (Next.js, App Router) para criar tags de conversão do **Meta
Pixel** e do **Google Ads** diretamente no Google Tag Manager, via Tag
Manager API v2. Interface em pt-BR.

## O que a aplicação faz

- Login com Google (OAuth2) e seleção de conta/container/workspace do GTM.
- Criação de tag **Google Ads** (`awct`), garantindo automaticamente a tag
  **Conversion Linker** (criada em "All Pages" se ainda não existir).
- Criação de tag **Meta Pixel** usando o template oficial da Community
  Template Gallery (publisher: Facebook) — importado via API se ainda não
  estiver no workspace — com `event_id` único para deduplicação.
- Criação (ou reaproveitamento) de acionadores: Custom Event ou Form
  Submission.
- Checkbox "Incluir dados do usuário": cria variáveis de dataLayer
  (`dlv - user_email`, `dlv - user_phone`, `dlv - user_first_name`,
  `dlv - user_last_name`), habilita Enhanced Conversions (Google Ads) /
  Advanced Matching (Meta) e mostra o snippet `dataLayer.push` pronto para o
  desenvolvedor colar no site.
- Tudo é criado como **rascunho** no workspace. A publicação é uma ação
  separada, com modal de confirmação mostrando o que será publicado.
- Tela de sucesso com resumo e link direto para o workspace no GTM.
- Histórico (nesta aba do navegador, em `sessionStorage`) do que foi criado.

## Rodando localmente

```bash
npm install
cp .env.example .env.local   # preencha com as credenciais (veja abaixo)
npm run dev
```

Acesse `http://localhost:3000`.

## Variáveis de ambiente (`.env.local`)

| Variável | Descrição |
|---|---|
| `NEXTAUTH_URL` | URL onde a app roda (ex: `http://localhost:3000`) |
| `NEXTAUTH_SECRET` | Gere com `openssl rand -base64 32` |
| `GOOGLE_CLIENT_ID` | Client ID OAuth2 do Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | Client Secret OAuth2 do Google Cloud Console |

## Configurando o Google Cloud Console (passo a passo)

### 1. Criar um projeto

1. Acesse [console.cloud.google.com](https://console.cloud.google.com/).
2. No topo, clique no seletor de projeto → **Novo projeto**.
3. Dê um nome (ex: `tags-conversao-gtm`) e clique em **Criar**.
4. Espere a notificação de criação e selecione o projeto recém-criado.

### 2. Ativar a Tag Manager API

1. No menu lateral, vá em **APIs e serviços** → **Biblioteca**.
2. Busque por **Tag Manager API**.
3. Clique nela e depois em **Ativar**.

### 3. Configurar a tela de consentimento OAuth

1. Vá em **APIs e serviços** → **Tela de permissão OAuth**.
2. Escolha o tipo de usuário:
   - **Interno**, se você usa Google Workspace e só a sua organização vai
     usar a ferramenta (recomendado, evita a etapa de verificação do Google).
   - **Externo**, se qualquer conta Google poderá logar (o app ficará em modo
     "Teste" até passar por verificação do Google — nesse modo funciona
     normalmente para os usuários de teste que você cadastrar).
3. Preencha nome do app, e-mail de suporte e e-mail de contato do
   desenvolvedor. Salve e continue.
4. Na etapa **Escopos**, clique em **Adicionar ou remover escopos** e adicione
   (busque por "tagmanager"):
   - `https://www.googleapis.com/auth/tagmanager.edit.containers`
   - `https://www.googleapis.com/auth/tagmanager.readonly`
   - `https://www.googleapis.com/auth/tagmanager.edit.containerversions`
   - `https://www.googleapis.com/auth/tagmanager.publish`

   > Os dois últimos escopos foram adicionados além dos dois originalmente
   > pedidos porque o botão **"Publicar versão"** da tela de sucesso chama os
   > métodos `create_version` e `versions.publish` da API, que exigem esses
   > escopos específicos — sem eles a publicação falha com "permissão
   > negada" mesmo com o usuário tendo acesso total no GTM.
5. Se o app estiver em modo **Externo/Teste**, na etapa **Usuários de teste**
   adicione os e-mails do Google que vão logar na aplicação (o seu e o de
   quem for testar).

### 4. Criar as credenciais OAuth2

1. Vá em **APIs e serviços** → **Credenciais**.
2. Clique em **Criar credenciais** → **ID do cliente OAuth**.
3. Tipo de aplicativo: **Aplicativo da Web**.
4. Em **URIs de redirecionamento autorizados**, adicione:
   - Para desenvolvimento local: `http://localhost:3000/api/auth/callback/google`
   - Para produção: `https://SEU-DOMINIO/api/auth/callback/google`
5. Clique em **Criar**. Copie o **Client ID** e o **Client Secret** gerados
   para `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET` no seu `.env.local`.

### 5. Dar acesso ao GTM para a conta que vai logar

A conta Google que fizer login precisa ter permissão de **Editor** (ou
superior) no container do Google Tag Manager onde as tags serão criadas —
isso é configurado dentro do próprio GTM (**Admin** → **Gerenciamento de
usuários do container**), não no Cloud Console.

### 6. Pronto

Com `.env.local` preenchido, rode `npm run dev` e faça login. Na primeira
vez, o Google vai pedir consentimento para os 4 escopos de Tag Manager.

## Observações técnicas importantes

- **Enhanced Conversions (Google Ads, tag `awct`)**: o Google não publica
  oficialmente, na referência REST da Tag Manager API, os nomes internos dos
  parâmetros do bloco de Enhanced Conversions manual (diferente de
  `conversionId`/`conversionLabel`, que são documentados). A aplicação usa os
  nomes mais consistentes com a nomenclatura pública do Google Ads
  (`enableEnhancedConversion`, `enhancedConversionsManualDataObject`, com
  campos `email`, `phone_number`, `first_name`, `last_name`). Depois de criar
  uma tag com "Incluir dados do usuário" marcado, abra a tag uma vez no GTM
  para confirmar que o mapeamento aparece corretamente; ajuste manualmente se
  necessário.
- **Template Meta Pixel**: é importado automaticamente a partir do repositório
  público `facebook/GoogleTagManager-WebTemplate-For-FacebookPixel` (o mesmo
  código-fonte do template oficial "Meta Pixel" da Community Template
  Gallery, mantido por Meta/Simo Ahava), preservando a referência de galeria
  (`galleryReference`) para que o GTM reconheça a origem do template.
- **Publicar versão**: usa `workspaces.create_version` seguido de
  `versions.publish` (dois passos — o primeiro por si só não deixa a versão
  live). Depois de publicar, o GTM encerra automaticamente o workspace de
  origem; para seguir editando, selecione outro workspace na tela inicial.
- **Histórico**: fica em `sessionStorage` do navegador (por aba), não em um
  banco de dados — é perdido ao fechar a aba, como pedido no escopo do
  projeto.
