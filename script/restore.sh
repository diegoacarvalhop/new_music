#!/usr/bin/env bash
# Restaura um backup do banco PostgreSQL (container newmusic-db).
# Lista os arquivos em bkp_bd e permite escolher qual restaurar.

set -e
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
BKP_DIR="$PROJECT_ROOT/bkp_bd"
CONTAINER="newmusic-db"
DB_USER="newmusic"
DB_NAME="newmusic"

if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER}$"; then
  echo "Container ${CONTAINER} não está rodando. Suba o banco (ex.: docker-compose up -d) e tente novamente."
  exit 1
fi

if [ ! -d "$BKP_DIR" ]; then
  echo "Pasta de backups não encontrada: ${BKP_DIR}"
  exit 1
fi

ARQUIVOS=()
for f in "$BKP_DIR"/bkp_bd_*.sql; do
  [ -e "$f" ] || break
  ARQUIVOS+=("$f")
done
if [ ${#ARQUIVOS[@]} -eq 0 ]; then
  echo "Nenhum arquivo de backup encontrado em ${BKP_DIR}"
  exit 1
fi
# Ordenar do mais recente para o mais antigo (nome = bkp_bd_AAAA-MM-DD_HHmmss.sql)
ARQUIVOS=($(printf '%s\n' "${ARQUIVOS[@]}" | sort -r))

echo "Backups disponíveis (mais recente primeiro):"
echo ""
n=1
for f in "${ARQUIVOS[@]}"; do
  echo "  $n) $(basename "$f")"
  ((n++)) || true
done
echo "  0) Cancelar"
echo ""
read -r -p "Escolha o número do backup para restaurar (0 para cancelar): " opcao

if [ "$opcao" = "0" ] || [ -z "$opcao" ]; then
  echo "Operação cancelada."
  exit 0
fi

n=1
ARQUIVO_SELECIONADO=""
for f in "${ARQUIVOS[@]}"; do
  if [ "$n" = "$opcao" ]; then
    ARQUIVO_SELECIONADO="$f"
    break
  fi
  ((n++)) || true
done

if [ -z "$ARQUIVO_SELECIONADO" ] || [ ! -f "$ARQUIVO_SELECIONADO" ]; then
  echo "Opção inválida."
  exit 1
fi

echo ""
echo "Será restaurado o arquivo: $(basename "$ARQUIVO_SELECIONADO")"
echo "ATENÇÃO: Os dados atuais do banco serão substituídos."
read -r -p "Confirma a restauração? (s/N): " confirma

if [ "$confirma" != "s" ] && [ "$confirma" != "S" ]; then
  echo "Operação cancelada."
  exit 0
fi

echo "Limpando schema public..."
docker exec -i "$CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"

echo "Restaurando backup..."
docker exec -i "$CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" < "$ARQUIVO_SELECIONADO"

echo "Restauração concluída."
