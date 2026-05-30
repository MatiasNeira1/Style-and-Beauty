#!/usr/bin/env bash
set -Eeuo pipefail

DOCKERHUB_USER="${DOCKERHUB_USER:-watoncitoxx}"
DOCKER_REGISTRY="${DOCKER_REGISTRY:-docker.io}"
TAG="${TAG:-latest}"
LOGIN="${LOGIN:-false}"

usage() {
  cat <<'USAGE'
Usage: scripts/docker-publish.sh [--login] [--tag TAG]

Environment:
  DOCKERHUB_USER    Docker Hub user or organization. Default: watoncitoxx
  DOCKER_REGISTRY   Registry host. Default: docker.io
  TAG               Image tag. Default: latest
  LOGIN             true|false. Default: false
USAGE
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --login)
      LOGIN="true"
      shift
      ;;
    --tag)
      TAG="${2:?Missing value for --tag}"
      shift 2
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown argument: $1" >&2
      usage >&2
      exit 2
      ;;
  esac
done

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd -- "${SCRIPT_DIR}/.." && pwd)"

SERVICES=(
  "gateway|backend/Api-gateway|style-and-beauty-gateway"
  "auth|backend/ms-auth|style-and-beauty-auth"
  "perfiles|backend/ms-perfiles|style-and-beauty-perfiles"
  "catalogo|backend/ms-catalogo|style-and-beauty-catalogo"
  "agenda|backend/ms-agenda|style-and-beauty-agenda"
  "inventario|backend/ms-inventario|style-and-beauty-inventario"
  "pagos|backend/ms-pagos|style-and-beauty-pagos"
  "extra|backend/ms-extra|style-and-beauty-extra"
  "notificacion-audit|backend/ms-notificacion-audit|style-and-beauty-notificacion-audit"
  "frontend|frontend|style-and-beauty-frontend"
)

if [[ "${LOGIN}" == "true" ]]; then
  docker login "${DOCKER_REGISTRY}"
fi

for service in "${SERVICES[@]}"; do
  IFS="|" read -r name context image_name <<< "${service}"
  image="${DOCKER_REGISTRY}/${DOCKERHUB_USER}/${image_name}:${TAG}"
  echo "Building ${name}: ${image}"
  docker build --pull -t "${image}" "${REPO_ROOT}/${context}"
done

for service in "${SERVICES[@]}"; do
  IFS="|" read -r name _ image_name <<< "${service}"
  image="${DOCKER_REGISTRY}/${DOCKERHUB_USER}/${image_name}:${TAG}"
  echo "Pushing ${name}: ${image}"
  docker push "${image}"
done

echo "Published ${#SERVICES[@]} images with tag ${TAG}."
