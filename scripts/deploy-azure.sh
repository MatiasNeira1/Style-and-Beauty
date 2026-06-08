#!/usr/bin/env bash
set -Eeuo pipefail

ENV_FILE="${ENV_FILE:-.env.azure}"
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.azure.yml}"
IMAGE_TAG="${IMAGE_TAG:-latest}"
RUN="${RUN:-false}"

echo "Style and Beauty Azure pre-deployment checklist"
echo "Env file: ${ENV_FILE}"
echo "Compose file: ${COMPOSE_FILE}"
echo "Image tag: ${IMAGE_TAG}"

if [[ ! -f "${ENV_FILE}" ]]; then
  echo "Missing ${ENV_FILE}. Create it from .env.azure.example and store real secrets in Azure, not in Git." >&2
  exit 1
fi

docker compose -f docker-compose.yml config --quiet
docker compose --env-file "${ENV_FILE}" -f "${COMPOSE_FILE}" config --quiet

cat <<CHECKS
Compose configuration is valid.
Required manual checks before deployment:
1. Firebase exposed key revoked and replaced with a new Azure secret.
2. Docker Hub images built and pushed with tag ${IMAGE_TAG}.
3. PostgreSQL/Mongo connection strings point to managed services.
4. CORS includes only the final frontend domains.
5. Protected endpoints were validated with a fresh Firebase ID token.
CHECKS

if [[ "${RUN}" == "true" ]]; then
  docker compose --env-file "${ENV_FILE}" -f "${COMPOSE_FILE}" pull
  docker compose --env-file "${ENV_FILE}" -f "${COMPOSE_FILE}" up -d --remove-orphans
  docker compose --env-file "${ENV_FILE}" -f "${COMPOSE_FILE}" ps
else
  echo "Dry run only. Set RUN=true for a VM/docker-compose deployment."
fi

