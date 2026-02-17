# New Music — Backend

API REST em Spring Boot (Gradle) para o sistema New Music.

---

## Pré-requisitos

| Ferramenta | Uso |
|------------|-----|
| **Java 17+** | Compilar e rodar a aplicação |
| **Gradle** (ou wrapper) | Build; a pasta já inclui `gradlew` / `gradlew.bat` |
| **Docker e Docker Compose** | Rodar PostgreSQL e/ou a API em container |
| **PostgreSQL** | Banco (ou use apenas o container) |

---

## Configuração do banco (padrão)

| Variável | Valor padrão |
|----------|---------------------------------------|
| URL | `jdbc:postgresql://localhost:5432/newmusic` |
| Usuário | `newmusic` |
| Senha | `newmusic` |
| Banco | `newmusic` |

---

## Formas de execução

### 1. Tudo pelo Docker

Backend (API + frontend no JAR) e PostgreSQL em containers. **Na pasta `backend`:**

```bash
docker-compose up -d
```

- **Aplicação:** http://localhost:8080  
- **Swagger:** http://localhost:8080/swagger-ui.html  
- **Banco:** `localhost:5432`, usuário/senha/banco: `newmusic`

**Parar:**

```bash
docker-compose down
```

**Remover tudo (containers, volumes e imagens):**

```bash
docker-compose down -v --rmi all
```

- `down` — para e remove os containers  
- `-v` — remove os volumes (dados do PostgreSQL são apagados)  
- `--rmi all` — remove as imagens usadas pelo compose  

Use esse comando quando quiser limpar completamente o ambiente Docker do projeto.

---

### 2. Só PostgreSQL no Docker e backend na IDE (IntelliJ / Eclipse)

**Passo 1 — Subir apenas o PostgreSQL**

Na pasta `backend`:

```bash
docker-compose -f docker-compose-local.yml up -d
```

**Passo 2 — Rodar o backend na IDE**

- **IntelliJ IDEA:** File → Open → selecione a pasta **`backend`**. O IntelliJ reconhece o projeto Gradle (`build.gradle`). Localize a classe `br.com.newmusic.NewMusicApplication` e execute (Run ou Shift+F10).
- **Eclipse:** File → Import → Gradle → Existing Gradle Project, raiz = pasta `backend`. Localize `NewMusicApplication` e Run As → Java Application.

A API ficará em http://localhost:8080.

**Parar o banco:**

```bash
docker-compose -f docker-compose-local.yml down
```

**Remover containers, volumes e imagens:**

```bash
docker-compose -f docker-compose-local.yml down -v --rmi all
```

---

### 3. Linha de comando (Gradle)

Na pasta `backend`:

```bash
./gradlew bootRun
```

Ou gerar o JAR e executar:

```bash
./gradlew bootJar
java -jar build/libs/newmusic-api-1.0.0.jar
```

(O nome do JAR pode variar conforme a versão em `build.gradle`.)

**Build do frontend e cópia para `static` (para JAR com frontend embutido):**

```bash
./gradlew buildFrontend
```

Depois rode `bootRun` ou `bootJar`. O script da raiz do projeto (`script/run.sh` ou `script/run.bat`) já faz o build do frontend, cópia e `bootJar` automaticamente.

---

## Testes

```bash
./gradlew test
```

---

## Usuário inicial

Na primeira execução é criado um usuário administrador:

- **E-mail:** `admin@newmusic.com`  
- **Senha:** `admin123`

Altere a senha após o primeiro acesso.

---

## Documentação da API (Swagger)

Com a aplicação rodando:

- **Swagger UI:** http://localhost:8080/swagger-ui.html  
- **OpenAPI JSON:** http://localhost:8080/v3/api-docs  

---

## Estrutura

| Item | Descrição |
|------|-----------|
| `src/main/java` | Código fonte (Spring Boot, JPA, Security, JWT) |
| `src/main/resources` | Configuração, migrations Flyway, `static` (frontend quando embutido) |
| `docker-compose.yml` | API + PostgreSQL |
| `docker-compose-local.yml` | Apenas PostgreSQL (para rodar a API na IDE) |
