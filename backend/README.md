# New Music — Backend

API REST em Spring Boot (Gradle). Este README descreve configuração/execução na IDE, testes e Swagger.

---

## Pré-requisitos

- **Java 17+**
- **Gradle** (ou use o wrapper: `./gradlew` na pasta `backend`)
- **PostgreSQL** (ou use o container: `docker-compose -f docker-compose-local.yml up -d` na pasta `backend`)

Banco padrão: `jdbc:postgresql://localhost:5432/newmusic`, usuário/senha/banco: `newmusic`.

---

## Configuração e execução na IDE

1. **Subir o PostgreSQL** (se usar Docker, na pasta `backend`):
   ```bash
   docker-compose -f docker-compose-local.yml up -d
   ```

2. **Abrir o projeto:**
   - **IntelliJ IDEA:** File → Open → selecione a pasta **`backend`**. O IntelliJ reconhece o projeto Gradle. Execute a classe `br.com.newmusic.NewMusicApplication` (Run ou Shift+F10).
   - **Eclipse:** File → Import → Gradle → Existing Gradle Project, raiz = pasta `backend`. Execute `NewMusicApplication` com Run As → Java Application.

A API ficará em http://localhost:8080.

---

## Testes

Na pasta `backend`:

```bash
./gradlew test
```

---

## Swagger

Com a aplicação rodando:

- **Swagger UI:** http://localhost:8080/swagger-ui.html  
- **OpenAPI JSON:** http://localhost:8080/v3/api-docs  
