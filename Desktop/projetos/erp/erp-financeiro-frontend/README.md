# ERP Financeiro — Frontend

Next.js 16 (App Router) + React 19 + TypeScript + Tailwind CSS.

Roda direto na máquina, com pnpm — **sem Docker**. O único vínculo com o backend
é a URL da API em `NEXT_PUBLIC_API_URL`; trocando essa variável o mesmo build
aponta para outro ambiente.

## Subindo

```bash
cp .env.example .env.local
pnpm install
pnpm dev        # http://localhost:3000
```

O backend precisa estar no ar em `http://localhost:8001` (veja
`erp-financeiro-backend/README.md`) — sem ele as telas carregam, mas exibem o
estado de erro, porque nenhum dado é calculado aqui.

Se subir em outra porta (`pnpm dev -- -p 3005`), acrescente a origem em
`CORS_ALLOWED_ORIGINS` no `.env` do backend, senão o navegador bloqueia as
requisições.

## Organização

```
src/
  app/                    rotas, espelhando os grupos do menu
    financeiro/           caixa-bancos, entradas, saidas, contas-pagar,
                          contas-receber, ficha-financeira, comissoes,
                          cobrancas, conciliacao, ajuste-saldo
    relatorios/           dre, fluxo-caixa, balancete, ponto-equilibrio,
                          roi, resumo-categorias, nf-saida, nf-entrada
    cadastros/            parceiros, vendedores, pessoal, servicos,
                          lista-precos, contas-financeiras, classificacao
    administracao/        parametros, plano-contas, investimentos, auditoria
  components/
    layout/               Sidebar, PageHeader
    data/                 Tabela, CardsIndicadores, Filtros, Gráficos, estados
    financeiro/           componentes compartilhados entre telas do módulo
  lib/
    api/                  client HTTP, tipos do contrato, hook de requisição
    format/               moeda, data, percentual, competência (pt-BR)
```

## Regra de fronteira

**Nenhum cálculo financeiro é reimplementado aqui.** DRE, ponto de equilíbrio,
saldos, comissões e totais chegam prontos da API. O frontend formata e exibe; o
que ele soma são apenas contagens triviais de exibição (quantos registros
ativos na lista carregada, por exemplo).

Todos os cards de indicadores vêm de endpoints `/totais` calculados no banco,
sobre o mesmo queryset filtrado da tabela — assim card e tabela nunca contam
histórias diferentes.

## Reuso

Três decisões que evitaram duplicação:

- **`ListaLancamentos`** atende Entradas e Saídas. A planilha define as duas
  abas com os mesmos campos, mudando só o sentido do dinheiro.
- **`ListaTitulos`** atende Contas a Pagar e a Receber, pela mesma razão que o
  backend tem uma base abstrata `TituloFinanceiro`.
- **`ListaNotasFiscais`** atende NFs de entrada e de saída.

O componente `Tabela` já trata os quatro estados que toda tela precisa:
carregando, erro (com "tentar novamente"), vazio e preenchido.

## Gráficos

SVG puro, sem biblioteca de charts. O que os relatórios precisam são barras
comparativas e uma rosca de participação — escrever isso à mão evita ~100 kB de
JavaScript e mantém o controle sobre acessibilidade.

## Comandos

```bash
pnpm dev          # http://localhost:3000
pnpm build
pnpm typecheck
pnpm lint
```

A URL da API vem de `NEXT_PUBLIC_API_URL` (padrão `http://localhost:8001/api/v1`).
Por ser `NEXT_PUBLIC_`, ela é embutida no bundle **em tempo de build** — mudá-la
exige reiniciar o `dev` ou refazer o `build`.

`turbopack.root` está fixado em `next.config.ts`. Sem isso o Turbopack sobe a
árvore de diretórios procurando um lockfile e pode inferir uma raiz fora do
projeto.

## Autenticação

Quem valida e-mail e senha é o **`admin-bff`** — o mesmo que atende
`funnels-admin` e `outbound-web`. O ERP não tem credencial própria.

```
navegador ──► /api/employee/signin ──► admin-bff        (login)
                 grava auth_token + response_cookie, httpOnly
navegador ──► /api/erp/[...path] ────► API do ERP       (dados)
                 anexa Authorization: Bearer <auth_token>
```

**O navegador nunca fala com o BFF nem com o Django.** Fala só com esta
aplicação, na própria origem. O token vive em cookie `httpOnly`: não está no
bundle, não está no `localStorage` e um XSS não o alcança. Quem o transforma em
cabeçalho é o Route Handler, no servidor.

São **dois** cookies porque o BFF exige os dois — o `authProvider.protect()` de
lá confere a sessão do express *e* o JWT do cabeçalho. Guardar só o token
deixaria o ERP fora do resto do ecossistema.

Consequências de ser tudo mesma origem: **não há CORS** e **não há token CSRF**.
O que barra o CSRF é o `SameSite=Lax` dos cookies — o navegador não os anexa em
POST vindo de outro site.

### Camadas

- **`proxy.ts`** (o antigo `middleware.ts`; o Next 16 renomeou a convenção) só
  confere que o cookie existe, para não montar a aplicação inteira e depois cair
  no login. Não valida assinatura: isso roda no edge, a cada navegação.
- **`components/layout/Aplicacao.tsx`** é a guarda de verdade do lado do
  cliente, e fica ali, não em cada página, para que tela nova nasça protegida.
  Enquanto a sessão não é confirmada, as páginas sequer montam — se montassem,
  disparariam requisições, tomariam 401 e piscariam erro a caminho do login.
- **A API do ERP** é quem decide: confere assinatura, prazo e usuário em toda
  requisição.

`ProvedorAuth` confirma a identidade chamando `auth/eu` **na API do ERP**, e não
lendo o JWT localmente: o que importa é se a outra ponta aceita a credencial,
não o que ela afirma sobre si mesma.

Quando alguma resposta volta com `codigo: "not_authenticated"`, o cliente avisa o
provedor e a pessoa vai para o login. O código vem do backend porque a mensagem
é traduzida: decidir comportamento pelo texto quebraria numa mudança de tradução.

## Produção

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

```bash
BFF_URL=https://bff.seudominio.com.br/ \
ERP_API_URL=https://api.seudominio.com.br/api/v1/ \
  docker compose -f docker-compose.prod.yml up -d
```

Repare que **nenhuma variável é `NEXT_PUBLIC_`**. Todas são lidas apenas no
servidor, e por isso são variáveis de *runtime* — não precisam de rebuild para
mudar, ao contrário do que acontecia antes. O navegador não sabe onde ficam a API
e o BFF; ele só conhece `/api/erp` e `/api/employee`, na própria origem.

A imagem é multi-estágio e serve o artefato `standalone` com `node server.js`,
como usuário não-root, escutando só em `127.0.0.1:3000` — quem atende a internet
e termina o TLS é o proxy reverso.

## `AGENTS.md` e `CLAUDE.md`

São **gerados pelo `next dev`**, não escritos à mão, e apontam agentes de IA
para a documentação do Next 16 embutida em `node_modules/next/dist/docs/`. Estão
versionados de propósito: apagá-los não resolve nada — o próximo `pnpm dev` os
recria e eles voltam como alteração pendente no `git status`.

Para desligar de vez, `agentRules: false` no `next.config.ts`.
