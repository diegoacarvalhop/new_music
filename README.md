# New Music

Sistema New Music (backend + frontend). Este README explica como rodar a aplicação completa com o script da pasta `script` e como usar backup e restore do banco de dados.

---

## Rodar a aplicação completa (script run)

O script faz o build do frontend (Vite), copia os arquivos para o backend, gera o JAR e inicia a aplicação. Se a porta 8080 estiver em uso, usa automaticamente a próxima livre (até 8099) e abre o navegador padrão quando o servidor estiver pronto.

**Pré-requisitos:** Java 17+, Yarn (Node), PostgreSQL rodando (ex.: na pasta `backend`, `docker-compose -f docker-compose-local.yml up -d`).

- **macOS / Linux:** na pasta `script`:
  ```bash
  ./run.sh
  ```
- **Windows:** na pasta `script`:
  ```cmd
  run.bat
  ```

A aplicação estará em http://localhost:8080 (ou na porta informada no terminal). O navegador é aberto automaticamente.

---

## Backup do banco de dados

Os scripts de backup geram um arquivo SQL do banco PostgreSQL e salvam na pasta **`bkp_bd`** na raiz do projeto (criada automaticamente). Eles usam o container Docker **`newmusic-db`** — o banco precisa estar rodando (ex.: `docker-compose up -d` ou `docker-compose -f docker-compose-local.yml up -d` na pasta `backend`).

**Como funciona:** executam `pg_dump` dentro do container e gravam o resultado em `bkp_bd/bkp_bd_AAAA-MM-DD_HHmmss.sql`.

- **macOS / Linux** (na pasta `script`):
  ```bash
  ./backup.sh
  ```
- **Windows** (na pasta `script`):
  ```cmd
  backup.bat
  ```

O arquivo gerado é exibido ao final (caminho e listagem).

---

## Restore do banco de dados

Os scripts de restore listam os arquivos de backup em **`bkp_bd`**, permitem escolher qual restaurar e substituem **todo o conteúdo atual** do banco pelo backup selecionado.

**Como funciona:**
1. Verificam se o container `newmusic-db` está rodando.
2. Listam os arquivos `bkp_bd_*.sql` (mais recente primeiro) e pedem o número do backup.
3. Pedem confirmação (os dados atuais serão substituídos).
4. Executam no banco: `DROP SCHEMA public CASCADE; CREATE SCHEMA public;` e em seguida restauram o conteúdo do arquivo com `psql`.

- **macOS / Linux** (na pasta `script`):
  ```bash
  ./restore.sh
  ```
- **Windows** (na pasta `script`):
  ```cmd
  restore.bat
  ```

**Atenção:** a restauração apaga o schema `public` e recria; todos os dados atuais do banco são perdidos e substituídos pelo backup escolhido.

---

## Outros READMEs

- **Backend** (IDE, testes, Swagger): `backend/README.md`
- **Frontend** (IDE, testes): `frontend/README.md`
