# FlowEstoque

Sistema de controle de estoque para operações logísticas, com foco em rastreabilidade de movimentações por nota fiscal. Atualmente em uso interno por uma empresa para gestão diária do armazém.

## Visão geral

Aplicação web completa com autenticação, controle de produtos, movimentações de entrada/saída, relatórios e exportação para Excel. Originalmente desenhada como SaaS multi-tenant (com isolamento de dados por RLS no Supabase), hoje opera como sistema interno de uma única empresa — a arquitetura multi-tenant permanece no código e pode ser reativada quando necessário.

## Funcionalidades

- **Autenticação** — login, cadastro por convite, redefinição de senha
- **Multi-tenant (arquitetura)** — suporte a múltiplas empresas com dados isolados via Row Level Security
- **Produtos** — cadastro com categorias, preço de custo/venda, estoque mínimo e caixas por palete
- **Movimentações** — registro de entradas e saídas por nota fiscal com transportadora
- **Relatórios** — histórico por nota, por produto e estoque atual com alertas de mínimo
- **Exportação Excel** — relatório mensal no formato operacional da empresa
- **Dashboard** — KPIs, gráfico de capacidade e últimas movimentações
- **Painel admin** — gestão de tenants, usuários, roles e convites
- **Auditoria** — log de ações destrutivas (excluir produto, movimentação, tenant, alterar role)
- **Rate limiting** — proteção contra abuso no cadastro

## Stack

| Camada | Tecnologia |
|---|---|
| Framework | Next.js 15 (App Router) |
| Linguagem | TypeScript |
| Estilização | Tailwind CSS + shadcn/ui |
| Backend/DB | Supabase (PostgreSQL + Auth + RLS) |
| Validação | Zod |
| Deploy | Vercel |

## Segurança

- Row Level Security em todas as tabelas com isolamento por tenant
- Validação Zod em todas as server actions
- Rate limiting por IP no cadastro
- Rota `/admin` protegida no middleware via variável de ambiente
- RLS por papel: escrita (inserir/alterar/excluir) restrita a `admin`/`operador` no próprio banco
- Rate limiting atômico (à prova de condição de corrida) no cadastro
- Audit log de ações destrutivas
- Roles: `admin`, `operador`, `visualizador`

## Estrutura do projeto

```
src/
├── app/
│   ├── (auth)/           # Rotas autenticadas
│   │   ├── admin/        # Painel administrativo
│   │   ├── dashboard/    # KPIs e gráficos
│   │   ├── estoque/      # Registro de movimentações
│   │   ├── produtos/     # Cadastro de produtos
│   │   ├── categorias/   # Categorias de produtos
│   │   └── relatorios/   # Relatórios e exportação
├── lib/
│   ├── supabase/         # Clients (server, client, admin, middleware)
│   ├── auditoria.ts      # Log de auditoria
│   ├── rateLimit.ts      # Rate limiting por IP
│   └── permissoes.ts     # Controle de roles
└── types/                # Tipos globais
```

## Variáveis de ambiente

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ADMIN_EMAIL=
```

## Rodando localmente

```bash
npm install
cp .env.example .env.local
# preencha as variáveis no .env.local
npm run dev
```
