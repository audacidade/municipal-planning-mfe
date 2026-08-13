# municipal-planning-mfe

MFE Module Federation — **P03 — Planejamento, Orçamento e Performance**.

Parte da [Plataforma Municipal SaaS](https://github.com/audacidade/municipal-docs).

## Pré-requisitos

- Node.js 20+
- [pnpm](https://pnpm.io/) 9+
- Shell host (`municipal-shell`) em `http://localhost:5020` (use `http://demo.localhost:5020` para tenant via Host)
- API gateway (`municipal-platform-backend`) em `http://localhost:3000` para integração completa

## Instalação e desenvolvimento

```bash
pnpm install
pnpm dev
```

- **Porta:** `http://localhost:5019` (definida em `rspack.config.ts`)
- **Remote Federation (name):** `planning_mfe`
- **Expose:** `./PlanningApp` → importado pelo shell como `planning_mfe/PlanningApp`
- **Entry:** `http://localhost:5019/remoteEntry.js`
- Override de porta: `PORT=5019 pnpm dev`

## Build

```bash
pnpm build
```

## API (backend)

Rotas consumidas (via gateway `:3000`): /core/plans, /core/budget-items

Módulo backend: ver `municipal-platform-backend` e catálogo em `municipal-shell/src/catalog.ts`.

## Como carrega no shell

1. O produto precisa estar `active` em `municipal-shell/src/catalog.ts`.
2. O shell declara o remote em `rspack.config.ts`: `planning_mfe@http://localhost:5019/remoteEntry.js`.
3. Em runtime, `remoteRegistry.ts` faz `import('planning_mfe/PlanningApp')` na rota do produto.

## Repositório

`https://github.com/audacidade/municipal-planning-mfe`

## Convenções

- Trunk-based: `main` + `feature/*`
- Carregado pelo `municipal-shell` quando o produto está `active` no catálogo
