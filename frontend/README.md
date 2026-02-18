# New Music — Frontend

Frontend React (Vite, TypeScript). Este README descreve configuração/execução na IDE e testes.

---

## Pré-requisitos

- **Node.js** (LTS)
- **Yarn**

---

## Configuração e execução na IDE / terminal

1. **Instalar dependências** (na pasta `frontend`):
   ```bash
   yarn install
   ```

2. **Rodar em desenvolvimento:**
   ```bash
   yarn dev
   ```
   A aplicação sobe em http://localhost:5173. O proxy envia `/api` para o backend em http://localhost:8080 — o backend precisa estar rodando (IDE ou `./gradlew bootRun` na pasta `backend`).

---

## Testes

Na pasta `frontend`:

```bash
yarn test
```
Executa os testes uma vez (Vitest).

```bash
yarn test:watch
```
Executa os testes em modo watch.
