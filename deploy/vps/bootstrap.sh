#!/usr/bin/env bash
# One-time setup of a fresh Ubuntu 24.04 VPS for the portfolio. Run as root on the server:
#   SITE_ADDRESS=":80" bash bootstrap.sh            # by IP, plain HTTP, noindex
#   SITE_ADDRESS="example.ru, www.example.ru" INDEXABLE=1 bash bootstrap.sh   # after DNS
# deploy.sh uploads this directory to /tmp/portfolio-deploy; re-running is safe.
#
# What it does: system updates and automatic security updates, a 1 GB swap file,
# Node.js 24 (NodeSource apt repo), Caddy (official apt repo), a system user
# "portfolio", /srv/portfolio/releases, the systemd unit, the Caddyfile and a firewall
# that keeps every port sshd listens on open. It never touches SSH keys or passwords.
set -Eeuo pipefail

[ "$(id -u)" = 0 ] || { echo "bootstrap: run as root" >&2; exit 2; }
. /etc/os-release
[ "$ID" = ubuntu ] && [ "${VERSION_ID%%.*}" -ge 24 ] || echo "bootstrap: tested on Ubuntu 24.04, found $PRETTY_NAME" >&2

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SITE_ADDRESS="${SITE_ADDRESS:-:80}"
INDEXABLE="${INDEXABLE:-0}"
export DEBIAN_FRONTEND=noninteractive

echo "==> packages"
apt-get update -q
apt-get -y -q upgrade
apt-get install -y -q curl ca-certificates gnupg ufw unattended-upgrades debian-keyring debian-archive-keyring apt-transport-https media-types
dpkg-reconfigure -f noninteractive unattended-upgrades

echo "==> swap"
if ! swapon --show=NAME --noheadings | grep -q .; then
  fallocate -l 1G /swapfile && chmod 600 /swapfile && mkswap /swapfile >/dev/null && swapon /swapfile
  grep -q '^/swapfile ' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi
echo 'vm.swappiness=10' > /etc/sysctl.d/90-portfolio.conf
sysctl -q --system

echo "==> journald limit"
mkdir -p /etc/systemd/journald.conf.d
printf '[Journal]\nSystemMaxUse=200M\n' > /etc/systemd/journald.conf.d/portfolio.conf
systemctl restart systemd-journald

echo "==> Node.js 24"
install -d -m 0755 /etc/apt/keyrings
if ! command -v node >/dev/null || [ "$(node -p 'process.versions.node.split(".")[0]')" != 24 ]; then
  curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor --yes -o /etc/apt/keyrings/nodesource.gpg
  echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_24.x nodistro main" > /etc/apt/sources.list.d/nodesource.list
  apt-get update -q && apt-get install -y -q nodejs
fi
node -v

echo "==> Caddy"
if ! command -v caddy >/dev/null; then
  curl -1sLf https://dl.cloudsmith.io/public/caddy/stable/gpg.key | gpg --dearmor --yes -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
  curl -1sLf https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt -o /etc/apt/sources.list.d/caddy-stable.list
  apt-get update -q && apt-get install -y -q caddy
fi
caddy version

echo "==> app user and directories"
id portfolio >/dev/null 2>&1 || useradd --system --home-dir /srv/portfolio --no-create-home --shell /usr/sbin/nologin portfolio
install -d -m 0755 -o root -g root /srv/portfolio
install -d -m 0755 -o portfolio -g portfolio /srv/portfolio/releases
install -d -m 0755 -o caddy -g caddy /var/log/caddy

echo "==> systemd unit"
install -m 0644 "$HERE/portfolio.service" /etc/systemd/system/portfolio.service
systemctl daemon-reload
systemctl enable portfolio >/dev/null
# Started by deploy.sh once the first release exists.

echo "==> Caddyfile ($SITE_ADDRESS)"
if [ "$INDEXABLE" = 1 ]; then robots='-X-Robots-Tag'; else robots='X-Robots-Tag "noindex, nofollow"'; fi
sed -e "s|__SITE_ADDRESS__|$SITE_ADDRESS|" -e "s|__ROBOTS_HEADER__|$robots|" "$HERE/Caddyfile" > /etc/caddy/Caddyfile.new
caddy validate --adapter caddyfile --config /etc/caddy/Caddyfile.new
mv /etc/caddy/Caddyfile.new /etc/caddy/Caddyfile
systemctl enable caddy >/dev/null
systemctl reload-or-restart caddy

echo "==> firewall"
ssh_ports="$(sshd -T 2>/dev/null | awk '$1=="port"{print $2}' | sort -u)"
[ -n "$ssh_ports" ] || ssh_ports=22
for p in $ssh_ports; do ufw allow "$p/tcp" >/dev/null; done
ufw allow 80/tcp >/dev/null
ufw allow 443/tcp >/dev/null
ufw allow 443/udp >/dev/null
ufw --force enable >/dev/null
ufw status | sed 's/^/    /'

echo "==> done; next: deploy.sh uploads and activates a release"
