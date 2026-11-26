#!/usr/bin/env bash
# Uploads a built release to the VPS and activates it. Run from Git Bash on Windows
# (Windows OpenSSH keeps the key's permissions right) or from Linux CI:
#   VPS_HOST=31.77.222.201 deploy/vps/deploy.sh [--bootstrap] [archive.tar.gz]
#
# --bootstrap  run bootstrap.sh first (fresh server; pass SITE_ADDRESS / INDEXABLE through)
# SSH_KEY      private key path; default ~/.ssh/id_ed25519_xipher_ilgiz_portfolio
# VPS_USER     default root
# The key is only passed to ssh -i; this script never reads or copies it.
set -Eeuo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
HOST="${VPS_HOST:?set VPS_HOST}"
USER_NAME="${VPS_USER:-root}"
KEY="${SSH_KEY:-$HOME/.ssh/id_ed25519_xipher_ilgiz_portfolio}"
BOOTSTRAP=0
if [ "${1:-}" = --bootstrap ]; then BOOTSTRAP=1; shift; fi
ARCHIVE="${1:-$(ls -1t "$HERE"/out/portfolio-*.tar.gz 2>/dev/null | head -n1)}"
[ -f "$ARCHIVE" ] || { echo "deploy: no archive; run build-release.sh first" >&2; exit 2; }
(cd "$(dirname "$ARCHIVE")" && sha256sum -c --quiet "$(basename "$ARCHIVE").sha256")

SSH_OPTS=(-i "$KEY" -o IdentitiesOnly=yes -o BatchMode=yes -o StrictHostKeyChecking=accept-new -o ConnectTimeout=15)
TARGET="$USER_NAME@$HOST"
SUDO=""; [ "$USER_NAME" = root ] || SUDO="sudo"
REMOTE_DIR=/tmp/portfolio-deploy

echo "==> ssh check $TARGET"
ssh "${SSH_OPTS[@]}" "$TARGET" "uname -sr && mkdir -p $REMOTE_DIR"

echo "==> upload $(basename "$ARCHIVE")"
scp "${SSH_OPTS[@]}" "$ARCHIVE" "$ARCHIVE.sha256" \
  "$HERE/activate-release.sh" "$HERE/bootstrap.sh" "$HERE/portfolio.service" "$HERE/Caddyfile" \
  "$TARGET:$REMOTE_DIR/"

if [ "$BOOTSTRAP" = 1 ]; then
  echo "==> bootstrap"
  ssh "${SSH_OPTS[@]}" "$TARGET" "$SUDO env SITE_ADDRESS='${SITE_ADDRESS:-:80}' INDEXABLE='${INDEXABLE:-0}' bash $REMOTE_DIR/bootstrap.sh"
fi

echo "==> activate"
ssh "${SSH_OPTS[@]}" "$TARGET" "$SUDO bash $REMOTE_DIR/activate-release.sh $REMOTE_DIR/$(basename "$ARCHIVE")"

echo "==> smoke"
node "$HERE/smoke.mjs" "${SMOKE_URL:-http://$HOST}"
