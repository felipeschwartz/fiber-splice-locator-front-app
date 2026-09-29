# Fiber Splice Locator — Mobile

Aplicativo React Native (Expo) usado pelos técnicos em campo para consultar
Caixas de Emenda Óptica (CEOs), abrir e acompanhar ordens de serviço, e
anexar fotos e localização de cada atendimento.

## Sobre o projeto

Este aplicativo foi desenvolvido como trabalho da disciplina Programação para
Dispositivos Móveis, do curso de Análise e Desenvolvimento de Sistemas da
Universidade Unisinos.

O projeto atende a uma necessidade real da [POP-RS/RNP](https://pop-rs.rnp.br/),
que hoje controla suas Caixas de Emenda Óptica (CEOs) por planilhas de Excel e
fotos trocadas por WhatsApp. Este repositório é o app mobile; a API que ele
consome está em
[fiber-splice-locator](https://github.com/felipeschwartz/fiber-splice-locator).

**Desenvolvedor principal:** [Felipe Schwartz](https://github.com/felipeschwartz)
**Colaboradores:** Eduardo Ribeiro Silveira, Vorni Valpir Fagundes da Cunha
Junior, Diego Ribeiro Torres, Lucas Candido Vargas

## Tecnologias utilizadas

- **React Native 0.81** + **Expo SDK 54** (managed workflow)
- **React Navigation** (native stack)
- **Axios** para chamadas HTTP
- **expo-camera**, **expo-location**, **expo-secure-store** (câmera, GPS e
  armazenamento seguro do token de login)
- **expo-image-picker** + **expo-image-manipulator** (fotos da galeria,
  convertidas para JPEG antes do envio, inclusive as HEIC do iPhone)
- **expo-notifications** (notificação push quando uma OS é atribuída ao
  técnico)
- **expo-local-authentication** (desbloqueio do app por biometria)
- **@expo/vector-icons** (ícones)
- TypeScript apenas para checagem de tipos (`npm run typecheck`) — o código é
  escrito em JavaScript

## Pré-requisitos

- **Node.js** (LTS) e **npm**
- O [BackEnd](https://github.com/felipeschwartz/fiber-splice-locator) rodando
  (local ou via Docker — veja o README de lá)
- Para efetivamente ver o app funcionando, uma das duas opções:
  - **Android Studio** com um emulador Android configurado (mais simples —
    não exige rede/firewall configurados, é a forma recomendada para avaliar
    o projeto), **ou**
  - O app **Expo Go** instalado num celular físico (Android ou iOS), na
    mesma rede Wi-Fi do computador

## Como rodar

```bash
npm install
npx expo start
```

Com o terminal do Expo aberto:
- pressione **`a`** para abrir no emulador Android (precisa estar aberto/rodando)
- ou escaneie o QR code exibido com o app **Expo Go** no celular

## Configurar a API

O endereço do backend vem da variável de ambiente `EXPO_PUBLIC_API_BASE_URL`,
lida em `config/api.js`. Se ela não for informada, o app usa
`http://10.0.2.2:8080`:

```js
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://10.0.2.2:8080';
```

- **Emulador Android** (padrão em desenvolvimento): `http://10.0.2.2:8080` é
  um endereço especial que o próprio emulador redireciona para o `localhost`
  da máquina, sem precisar de nenhuma configuração de rede.
- **Celular físico**, na mesma rede do computador: crie um arquivo `.env.local`
  (ignorado pelo git) com `EXPO_PUBLIC_API_BASE_URL` apontando para o IP local
  da máquina que roda o backend (descubra com `ipconfig` no Windows ou
  `ifconfig`/`ip a` no Linux/Mac), por exemplo `EXPO_PUBLIC_API_BASE_URL=http://192.168.0.10:8080`.
  Nesse caso é necessário também que o firewall do computador libere a porta
  8080 para conexões de entrada, e que a rede esteja configurada como
  "Privada" (no Windows, redes "Públicas" bloqueiam isso por padrão).
- **APK gerado pelo EAS** (perfis `preview` e `production` do `eas.json`):
  aponta para o servidor de testes, `https://4-228-99-110.sslip.io`. O endereço
  precisa ser HTTPS, porque o Android bloqueia HTTP puro nos apps instalados.
  Para trocar de servidor, altere o `eas.json` e gere um APK novo.

## Gerar o APK (EAS)

O APK instalável é gerado na nuvem pelo **EAS Build**, com a sua conta do
Expo. A ferramenta de linha de comando não vem com o Expo; dá para usar sem
instalar:

```bash
npx eas-cli build -p android --profile preview
```

Ou instalar uma vez (`npm install -g eas-cli`) e usar `eas build -p android
--profile preview`. Na primeira vez, o EAS pede login na conta do Expo (dona do
projeto: `felipeschwartz.br`, conforme o `app.json`). No fim do build, ele
mostra um link/QR code para baixar o APK no celular.

O app **não** tem atualização pelo ar: qualquer mudança de código ou de
endereço da API exige gerar e instalar um APK novo.

## Contas de teste

Com o backend no perfil `dev` (o padrão para desenvolvimento), ao subir com o
banco vazio ele cria usuários de exemplo:

| E-mail | Senha | Perfil |
|---|---|---|
| superadmin@fiberlocator.com | superadmin123 | SUPER_ADMIN |
| admin@fiberlocator.com | admin123 | ADMIN |
| carlos.silva@fiberlocator.com | tech123 | FIELD_TECHNICIAN |

Essas contas **não existem** no perfil `prod` do backend (veja o README do
backend).

## Regras de acesso que o app reflete

As regras valem no backend; o app mostra as mensagens de erro que ele envia:

- **Login:** depois de 5 senhas erradas para o mesmo e-mail, a partir do
  mesmo aparelho/rede, o login fica bloqueado por 15 minutos ("Muitas
  tentativas. Tente novamente em X minuto(s)."). O "Esqueci minha senha"
  também tem limite de pedidos.
- **Senhas:** novas senhas (criação de usuário, troca e redefinição) precisam
  ter pelo menos 8 caracteres.
- **Ordens de serviço:** o técnico **vê** qualquer OS (o histórico de uma CEO
  mostra as OS de todos), mas só **atende e anexa fotos** nas OS atribuídas a
  ele. Administradores podem atender qualquer uma.
- **Busca de usuários:** devolve só ID, nome e e-mail, para qualquer perfil.

## Estrutura do projeto

```
theme/         cores, espaçamento, tipografia e sombra — a única fonte de
               valores visuais do app. Mudar uma cor aqui reflete em todas
               as telas que a usam.
components/ui/ kit de componentes de interface reutilizáveis (Screen,
               HeroHeader, PageHeader, HamburgerMenu, HomeButton, Button,
               Card, SectionCard, TextField, SelectField, Chip, InfoRow,
               GeoRow, Modal, LinkText, IconTile, EmptyState, LoadingView,
               ErrorBanner). Toda tela é montada com essas peças em vez de
               recriar estilo próprio.
components/    componentes específicos do domínio (StatusBadge,
               ServiceOrderCard, CameraCapture).
utils/         helpers puros de formatação e leitura de dados da API, e a
               lista de atalhos de navegação usada na tela inicial e no
               menu sanduíche.
screens/       uma tela por arquivo (Login, Boas-vindas, Ordens de Serviço,
               CEOs, Usuários e as respectivas telas de detalhe/criação),
               montada a partir do theme + kit de UI.
services/      chamadas HTTP (axios) por domínio (auth, ceo, usuário, ordem
               de serviço, fotos, histórico, localização) e o armazenamento
               do token/usuário logado.
contexts/      estado de autenticação (AuthContext).
config/        URL base da API e mapa de rotas do backend.
```

### Para mudar o visual do app

Edite os arquivos em `theme/` — não hexadecimais soltos nas telas.

### Para adicionar uma tela nova

Componha com `Screen` + (`HeroHeader` ou `PageHeader`) + `SectionCard` para
manter o mesmo espaçamento, cores e cabeçalho das demais telas. Cadastre a
rota em `App.js` e, se fizer sentido como atalho principal, em
`utils/navigation.js` (usado pela tela inicial e pelo menu sanduíche).

## Repositórios relacionados

- **BackEnd:** [fiber-splice-locator](https://github.com/felipeschwartz/fiber-splice-locator)
- **Painel web:** [fiber-splice-locator-front-web](https://github.com/felipeschwartz/fiber-splice-locator-front-web)
