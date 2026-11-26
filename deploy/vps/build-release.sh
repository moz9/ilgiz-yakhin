#!/usr/bin/env bash
# Builds a self-contained release of the portfolio for the VPS.
#
# Run on Linux (WSL Ubuntu 24.04 or CI), never on the 2 GB server itself:
#   deploy/vps/build-release.sh [git-ref]
#
# The release is built from a clean export of the committed tree, so untracked
# files in the working copy never reach the server. Output:
#   deploy/vps/out/portfolio-<rev>.tar.gz and .sha256
#
# SITE_URL sets NEXT_PUBLIC_SITE_URL (canonical links, sitemap, robots). Until the
# domain is chosen it stays on the Vercel address, so the mirror never competes
# with production in search.
set -Eeuo pipefail

REF="${1:-HEAD}"
SITE_URL="${SITE_URL:-https://ilgiz-yakhin.vercel.app}"
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
GIT=(git -c safe.directory='*')
REPO="$("${GIT[@]}" -C "$HERE" rev-parse --show-toplevel)"
OUT="${OUT_DIR:-$HERE/out}"
REV="$("${GIT[@]}" -C "$REPO" rev-parse --short=12 "$REF")"

case "$(uname -s)" in Linux) ;; *) echo "build-release: run on Linux (WSL or CI)" >&2; exit 2 ;; esac
node_major="$(node -p 'process.versions.node.split(".")[0]')"
[ "$node_major" = "24" ] || { echo "build-release: Node 24 required, found $(node -v)" >&2; exit 2; }

# Build on the Linux filesystem: npm ci on /mnt/<drive> is slow and trips over permissions.
WORK="$(mktemp -d /tmp/portfolio-build.XXXXXX)"
trap 'rm -rf "$WORK"' EXIT
mkdir -p "$WORK/src" "$OUT"

echo "==> export $REF ($REV)"
"${GIT[@]}" -C "$REPO" archive --format=tar "$REF" | tar -x -C "$WORK/src"
cd "$WORK/src"

echo "==> npm ci"
npm ci --no-audit --no-fund --loglevel=error

echo "==> next build (standalone, site $SITE_URL)"
NEXT_OUTPUT=standalone NEXT_PUBLIC_SITE_URL="$SITE_URL" NEXT_TELEMETRY_DISABLED=1 npm run build

S=.next/standalone
[ -f "$S/server.js" ] || { echo "build-release: standalone server.js missing" >&2; exit 1; }
# server.js serves these itself when present; Caddy serves them directly as well.
cp -r public "$S/public"
mkdir -p "$S/.next"
cp -r .next/static "$S/.next/static"
# A release starts with an empty runtime cache; ISR pages regenerate per release.
rm -rf "$S/.next/cache"

cat > "$S/release.json" <<JSON
{
  "revision": "$("${GIT[@]}" -C "$REPO" rev-parse "$REF")",
  "short": "$REV",
  "builtAt": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "node": "$(node -v)",
  "next": "$(node -p 'require("next/package.json").version')",
  "siteUrl": "$SITE_URL"
}
JSON

ARCHIVE="$OUT/portfolio-$REV.tar.gz"
tar -C "$S" -czf "$ARCHIVE" .
(cd "$OUT" && sha256sum "$(basename "$ARCHIVE")" > "$(basename "$ARCHIVE").sha256")

echo "==> $ARCHIVE"
du -h "$ARCHIVE" | cut -f1 | sed 's/^/    size /'
