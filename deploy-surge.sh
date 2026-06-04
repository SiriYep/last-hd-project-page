#!/usr/bin/env bash
set -euo pipefail

domain="${1:-last-hd.surge.sh}"
root="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
dist="$root/surge-dist"

if [[ -n "$(git -C "$root" status --porcelain --untracked-files=no)" ]]; then
  echo "Tracked files have uncommitted changes. Commit or stash them before deploying." >&2
  exit 1
fi

rm -rf "$dist"
mkdir -p "$dist"

git -C "$root" archive --format=tar HEAD | tar -xf - -C "$dist"

rm -rf \
  "$dist/.gitignore" \
  "$dist/.surgeignore" \
  "$dist/deploy-surge.sh" \
  "$dist/assets/paper" \
  "$dist/paper"

npx --yes surge "$dist" "$domain"
