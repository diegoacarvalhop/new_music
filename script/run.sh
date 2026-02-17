#!/usr/bin/env bash
set -e
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR/.."

if ! command -v java &> /dev/null; then
  echo "Java não encontrado. Instale JDK 17+."
  exit 1
fi

if ! command -v yarn &> /dev/null; then
  echo "Yarn não encontrado. Necessário para o build. Instale Node e Yarn."
  exit 1
fi

WRAPPER_JAR="backend/gradle/wrapper/gradle-wrapper.jar"
if [ ! -f "$WRAPPER_JAR" ]; then
  echo "Gradle Wrapper JAR não encontrado. Baixando..."
  mkdir -p backend/gradle/wrapper
  if command -v curl &> /dev/null; then
    if ! curl -sSL -o "$WRAPPER_JAR" "https://github.com/gradle/gradle/raw/v8.5.0/gradle/wrapper/gradle-wrapper.jar"; then
      echo "Falha ao baixar o Gradle Wrapper. Verifique sua conexão ou instale o Gradle: brew install gradle"
      exit 1
    fi
  else
    echo "curl não encontrado. Instale curl ou o Gradle (brew install gradle) e rode o build pela IDE."
    exit 1
  fi
  echo "Gradle Wrapper baixado."
fi

echo "Construindo aplicação (backend + frontend)..."
cd frontend && yarn install --frozen-lockfile 2>/dev/null || yarn install
yarn build
if [ $? -ne 0 ]; then
  echo "Build do frontend falhou."
  exit 1
fi
cd ..

mkdir -p backend/src/main/resources/static
rm -rf backend/src/main/resources/static/*
cp -r frontend/dist/* backend/src/main/resources/static/

cd backend && chmod +x gradlew 2>/dev/null; ./gradlew bootJar && cd ..

JAR=$(find backend/build/libs -name '*.jar' -not -name '*-plain.jar' 2>/dev/null | head -1)
if [ -z "$JAR" ]; then
  echo "JAR não encontrado em backend/build/libs."
  exit 1
fi

# Porta padrão 8080; se estiver em uso, usa a próxima livre (até 8099)
port_in_use() {
  if command -v lsof &>/dev/null; then
    lsof -i ":$1" &>/dev/null
  else
    netstat -an 2>/dev/null | grep -q "[:.]$1 .*LISTEN"
  fi
}
APP_PORT=8080
while port_in_use "$APP_PORT"; do
  if [ "$APP_PORT" -ge 8099 ]; then
    echo "Nenhuma porta livre entre 8080 e 8099."
    exit 1
  fi
  APP_PORT=$((APP_PORT + 1))
done
if [ "$APP_PORT" -ne 8080 ]; then
  echo "Porta 8080 em uso. Usando porta $APP_PORT."
fi

echo "Iniciando aplicação..."
echo "Acesse: http://localhost:$APP_PORT"
echo "PostgreSQL deve estar rodando (padrão: localhost:5432/newmusic)."

APP_URL="http://localhost:$APP_PORT"
java -Dserver.port=$APP_PORT -jar "$JAR" &
JAVA_PID=$!
echo "Aguardando servidor subir para abrir o navegador..."
for i in 1 2 3 4 5 6 7 8 9 10 11 12; do
  sleep 1
  if curl -s -o /dev/null -w "%{http_code}" "$APP_URL" 2>/dev/null | grep -q '200\|301\|302'; then
    break
  fi
done
if command -v open &>/dev/null; then
  open "$APP_URL"
elif command -v xdg-open &>/dev/null; then
  xdg-open "$APP_URL"
else
  echo "Abra no navegador: $APP_URL"
fi
wait $JAVA_PID
