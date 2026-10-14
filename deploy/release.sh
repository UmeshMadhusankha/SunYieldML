#!/usr/bin/env bash
set -euo pipefail
cd /opt/sunyield/deploy
if [[ $# != 2 || ! "$1" =~ ^ghcr\.io/[a-z0-9_./-]+@sha256:[a-f0-9]{64}$ || ! "$2" =~ ^ghcr\.io/[a-z0-9_./-]+@sha256:[a-f0-9]{64}$ ]]; then
  echo 'Expected two immutable ghcr.io image digests' >&2; exit 2
fi
exec 9>release.lock
flock -n 9 || { echo 'Another release is running' >&2; exit 3; }
had_previous=0
if [[ -f release.env ]]; then cp release.env previous-release.env; had_previous=1; fi
printf 'BACKEND_IMAGE=%s\nML_IMAGE=%s\n' "$1" "$2" >release.env
chmod 600 release.env
compose() { docker compose --env-file production.env --env-file release.env -f compose.production.yaml "$@"; }
rollback() {
  echo 'Deployment failed; restoring the previous application images' >&2
  if [[ $had_previous == 1 ]]; then cp previous-release.env release.env; compose up -d --wait backend caddy || true; else echo 'First release failed; inspect service logs' >&2; fi
}
trap rollback ERR
compose pull
compose up -d --wait db ml
compose run --rm migrate
compose up -d --wait backend caddy
curl --fail --silent http://127.0.0.1:3001/health/ready >/dev/null
trap - ERR
echo 'Application release healthy. Frontend publication is the next CD step.'
