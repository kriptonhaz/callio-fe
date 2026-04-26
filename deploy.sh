#!/usr/bin/env bash
#
# Deploy callio-fe to the production server.
#
#   1. Prompts for the SSH password (or reuses an SSH key if you have one set up).
#   2. SSH-es into the server and runs the full pull → build → publish pipeline.
#   3. Streams remote stdout/stderr back to your terminal so you can watch it.
#
# Usage:
#   ./deploy.sh                                          # uses defaults below
#   SSH_TARGET=foo@1.2.3.4 SSH_PORT=22 ./deploy.sh        # override per-call
#
# If you have `sshpass` installed (recommended), the script prompts once and
# pipes the password automatically. Otherwise, ssh itself prompts.
#
#   macOS:   brew install hudochenkov/sshpass/sshpass
#   Debian:  sudo apt-get install -y sshpass
#

set -euo pipefail

# ---------------------------------------------------------------------------
# Config — edit these to match your server
# ---------------------------------------------------------------------------
SSH_TARGET="${SSH_TARGET:-callio@43.133.133.102}"
SSH_PORT="${SSH_PORT:-555}"
PROJECT_DIR="${PROJECT_DIR:-/home/callio/prod/callio-fe}"
WEBROOT="${WEBROOT:-/var/www/rangcool.callio-tech.com}"

# ---------------------------------------------------------------------------
# Helpers (local)
# ---------------------------------------------------------------------------
RED=$'\033[31m'
GREEN=$'\033[32m'
YELLOW=$'\033[33m'
BOLD=$'\033[1m'
RESET=$'\033[0m'

step() { printf '\n%s==> %s%s\n' "$BOLD$GREEN" "$1" "$RESET"; }
warn() { printf '%s%s%s\n' "$YELLOW" "$1" "$RESET" >&2; }
fail() { printf '%s%s%s\n' "$RED" "$1" "$RESET" >&2; exit 1; }

# ---------------------------------------------------------------------------
# Remote script — runs on the server. PROJECT_DIR and WEBROOT are passed in
# positionally so the heredoc can be quoted (= no local expansion footguns).
# ---------------------------------------------------------------------------
read -r -d '' REMOTE_SCRIPT <<'REMOTE' || true
set -euo pipefail

PROJECT_DIR="$1"
WEBROOT="$2"

# Non-interactive ssh sessions don't source ~/.bashrc, so user-local installs
# (bun, fnm, nvm, etc.) are missing from PATH. Add the common locations
# explicitly. Edit/extend if your tool is installed elsewhere.
export PATH="$HOME/.bun/bin:$HOME/.local/bin:/usr/local/bin:/usr/bin:/bin:$PATH"

remote_step() { printf '\n>>> %s\n' "$1"; }

remote_step "Pulling latest code in $PROJECT_DIR"
cd "$PROJECT_DIR"
git pull --ff-only

remote_step "Installing dependencies (bun install)"
bun install

remote_step "Building (bun run build)"
bun run build

remote_step "Wiping current webroot $WEBROOT"
cd "$WEBROOT"
# Refuse to clean obviously-dangerous paths (typo guard).
case "$(pwd)" in
  /|/home|/var|/var/www|/etc|/usr)
    echo "Refusing to clean dangerous path: $(pwd)" >&2
    exit 1
    ;;
esac
rm -rf -- ./* ./.[!.]* ./..?* 2>/dev/null || true

remote_step "Publishing new build"
mv "$PROJECT_DIR/dist/client.zip" .
unzip -q client.zip
cd client
shopt -s dotglob nullglob
mv -- * ..
shopt -u dotglob nullglob
cd ..
rm -rf client client.zip

remote_step "Renaming _shell.html -> index.html"
if [[ -f _shell.html ]]; then
  mv _shell.html index.html
else
  echo "Note: _shell.html not present, skipping rename."
fi

remote_step "Deploy complete on $(hostname)"
REMOTE

# ---------------------------------------------------------------------------
# Run remotely — prefer sshpass for an in-script password prompt; fall back
# to plain ssh which prompts itself.
# ---------------------------------------------------------------------------
step "Deploying callio-fe to ${SSH_TARGET} (port ${SSH_PORT})"

SSH_OPTS=(
  -p "$SSH_PORT"
  -o StrictHostKeyChecking=accept-new
  -o LogLevel=ERROR
)

if command -v sshpass >/dev/null 2>&1; then
  read -srp "SSH password for ${SSH_TARGET}: " SSHPASS
  echo
  export SSHPASS
  sshpass -e ssh "${SSH_OPTS[@]}" "$SSH_TARGET" \
    "bash -s -- '$PROJECT_DIR' '$WEBROOT'" <<< "$REMOTE_SCRIPT"
else
  warn "sshpass not found - ssh will prompt for the password directly."
  warn "  macOS:  brew install hudochenkov/sshpass/sshpass"
  warn "  Debian: sudo apt-get install -y sshpass"
  ssh "${SSH_OPTS[@]}" "$SSH_TARGET" \
    "bash -s -- '$PROJECT_DIR' '$WEBROOT'" <<< "$REMOTE_SCRIPT"
fi

step "Done. Visit your site to verify."
