# New Music — Frontend

Frontend React (Vite, TypeScript) do sistema New Music.

---

## Pré-requisitos

| Ferramenta | Uso |
|------------|-----|
| **Node.js** (LTS) | Runtime |
| **Yarn** | Instalação de dependências e scripts |

---

## Instalação

Na pasta `frontend`:

```bash
yarn install
```

---

## Desenvolvimento

```bash
yarn dev
```

A aplicação sobe em http://localhost:5173 (Vite). O proxy está configurado para enviar requisições `/api` para o backend em http://localhost:8080 — o backend precisa estar rodando (por exemplo na IDE ou com `./gradlew bootRun` na pasta `backend`).

---

## Build

```bash
yarn build
```

Gera a pasta `dist/` com os arquivos estáticos. Para servir a aplicação completa (backend + frontend), use o script da raiz do projeto (`script/run.sh` ou `script/run.bat`), que faz o build do frontend, copia para `backend/src/main/resources/static` e gera o JAR do backend.

---

## Testes

```bash
yarn test
```

Executa os testes uma vez (Vitest).

```bash
yarn test:watch
```

Executa os testes em modo watch.

---

## Preview do build

```bash
yarn preview
```

Sobe um servidor local para testar o conteúdo de `dist/`. Útil para validar o build antes de integrar ao backend.

---

## Estrutura

| Pasta / arquivo | Descrição |
|-----------------|-----------|
| `src/components` | Componentes reutilizáveis (modais, paginação, etc.) |
| `src/pages` | Páginas da aplicação (Login, Alunos, Turmas, etc.) |
| `src/context` | Contextos React (Auth, Theme) |
| `src/api` | Cliente HTTP (axios) e integração com a API |
| `src/utils` | Funções utilitárias (validação, datas, formatação) |
| `src/types` | Tipos e interfaces TypeScript |
| `src/locales` | Traduções (i18n: pt-BR, en, es) |
| `vite.config.ts` | Configuração do Vite (proxy, build) |
