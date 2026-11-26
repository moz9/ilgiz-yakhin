#!/usr/bin/env bash
# Runs on the server as root (deploy.sh calls it): unpacks a release next to the old
# ones, switches /srv/portfolio/current atomically, restarts the service and rolls
# back to the previous release if the new one does not answer.
#   bash activate-release.sh /tmp/portfolio-deploy/portfolio-<rev>.tar.gz
#   bash activate-release.sh --rollback        # back to the previous release
set -Eeuo pipefail

BASE=/srv/portfolio
KEEP=5

health() {
  for _ in $(seq 1 40); do
    if curl -fsS -o /dev/null --max-time 5 http://127.0.0.1:3000/; then return 0; fi
    sleep 1
  done
  return 1
}

switch_to() {
  ln -sfn "$1" "$BASE/current.new"
  mv -Tf "$BASE/current.new" "$BASE/current"
  systemctl restart portfolio
}

prev="$(readlink -f "$BASE/current" 2>/dev/null || true)"

if [ "${1:-}" = --rollback ]; then
  target="$(ls -1dt "$BASE"/releases/*/ 2>/dev/null | sed 's|/$||' | grep -vxF "$prev" | head -n1 || true)"
  [ -n "$target" ] || { echo "activate: no older release" >&2; exit 1; }
  switch_to "$target"
  health && echo "activate: rolled back to $(basename "$target")" || { echo "activate: rollback target does not answer" >&2; exit 1; }
  exit 0
fi

archive="${1:?usage: activate-release.sh <archive.tar.gz> | --rollback}"
sum="$archive.sha256"
if [ -f "$sum" ]; then (cd "$(dirname "$archive")" && sha256sum -c --quiet "$(basename "$sum")"); fi

name="$(basename "$archive" .tar.gz)-$(date -u +%Y%m%d%H%M%S)"
rel="$BASE/releases/$name"
install -d -o portfolio -g portfolio "$rel"
tar -xzf "$archive" -C "$rel" --no-same-owner
chown -R portfolio:portfolio "$rel"

echo "activate: $name (previous: ${prev:+$(basename "$prev")})"
switch_to "$rel"
if health; then
  echo "activate: healthy"
else
  echo "activate: new release does not answer" >&2
  journalctl -u portfolio -n 30 --no-pager >&2 || true
  if [ -n "$prev" ] && [ -d "$prev" ]; then
    switch_to "$prev"
    health && echo "activate: rolled back to $(basename "$prev")" >&2
  fi
  exit 1
fi

# Keep the newest releases; never remove the active one.
current="$(readlink -f "$BASE/current")"
ls -1dt "$BASE"/releases/*/ | sed 's|/$||' | tail -n +$((KEEP + 1)) | while read -r old; do
  [ "$old" = "$current" ] || rm -rf "$old"
done
rm -f "$archive" "$sum"
