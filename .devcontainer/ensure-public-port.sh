#!/usr/bin/env bash
set -u

PIDFILE="/tmp/spesmundi-port-supervisor.pid"
LOGFILE="/tmp/ensure-public-port.log"
TARGET_PORT="5173"
CHECK_INTERVAL=15

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" >> "$LOGFILE"
}

# 1. Controle de instancia unica
if [ -f "$PIDFILE" ]; then
  OLD_PID=$(cat "$PIDFILE" 2>/dev/null || true)
  if [ -n "$OLD_PID" ] && kill -0 "$OLD_PID" 2>/dev/null; then
    log "Supervisor ja em execucao (PID $OLD_PID). Encerrando nova chamada redundante."
    exit 0
  fi
fi
echo "$$" > "$PIDFILE"

# 2. Verificacao de ambiente Codespaces
if [ "${CODESPACES:-false}" != "true" ] || [ -z "${CODESPACE_NAME:-}" ]; then
  log "Ambiente nao e um GitHub Codespace ativo. Supervisor encerrando."
  rm -f "$PIDFILE"
  exit 0
fi

# 3. Verificacao de disponibilidade do GitHub CLI
if ! command -v gh >/dev/null 2>&1; then
  log "GitHub CLI (gh) nao encontrado no sistema. Supervisor encerrando."
  rm -f "$PIDFILE"
  exit 0
fi

log "Supervisor SpesMundi iniciado para a porta $TARGET_PORT no Codespace $CODESPACE_NAME (PID $$)"

trap 'log "Supervisor encerrando..."; rm -f "$PIDFILE"; exit 0' SIGTERM SIGINT SIGHUP

# 4. Loop de supervisao continua
while true; do
  PORT_ACTIVE=false
  if ss -tulpn 2>/dev/null | grep -q ":$TARGET_PORT "; then
    PORT_ACTIVE=true
  elif netstat -tulpn 2>/dev/null | grep -q ":$TARGET_PORT "; then
    PORT_ACTIVE=true
  elif lsof -i:$TARGET_PORT 2>/dev/null | grep -q LISTEN; then
    PORT_ACTIVE=true
  fi

  if [ "$PORT_ACTIVE" = "true" ]; then
    CURRENT_VISIBILITY=$(gh codespace ports --json sourcePort,visibility -c "$CODESPACE_NAME" 2>/dev/null | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    vis = next((p.get('visibility') for p in data if str(p.get('sourcePort')) == '$TARGET_PORT'), None)
    print(vis or 'none')
except Exception:
    print('error')
" 2>/dev/null || echo "error")

    if [ "$CURRENT_VISIBILITY" != "public" ]; then
      log "Porta $TARGET_PORT ativa mas visibilidade e '$CURRENT_VISIBILITY'. Alterando para 'public'..."
      if gh codespace ports visibility "$TARGET_PORT:public" -c "$CODESPACE_NAME" >> "$LOGFILE" 2>&1; then
        log "Porta $TARGET_PORT configurada como 'public' com sucesso."
      else
        log "AVISO: Falha ao tentar alterar visibilidade da porta $TARGET_PORT via gh CLI."
      fi
    fi
  fi

  sleep $CHECK_INTERVAL
done
