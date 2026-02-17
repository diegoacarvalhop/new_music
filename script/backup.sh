#!/usr/bin/env bash
# Backup do banco PostgreSQL (container newmusic-db).
# Salva em: bkp_bd/bkp_bd_AAAA-MM-DD_HHmmss.sql

set -e
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
BKP_DIR="$PROJECT_ROOT/bkp_bd"
CONTAINER="newmusic-db"
DB_USER="newmusic"
DB_NAME="newmusic"

DATA_BACKUP="$(date +%Y-%m-%d_%H%M%S)"
ARQUIVO="$BKP_DIR/bkp_bd_${DATA_BACKUP}.sql"

mkdir -p "$BKP_DIR"

if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER}$"; then
  echo "Container ${CONTAINER} não está rodando. Suba o banco (ex.: docker-compose up -d) e tente novamente."
  exit 1
fi

echo "Gerando backup do banco ${DB_NAME}..."
docker exec "$CONTAINER" pg_dump -U "$DB_USER" "$DB_NAME" > "$ARQUIVO"

echo "Backup salvo em: ${ARQUIVO}"
ls -la "$ARQUIVO"
