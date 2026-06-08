param(
    [string]$EnvFile = ".env.azure",
    [string]$ComposeFile = "docker-compose.azure.yml",
    [string]$ImageTag = "latest",
    [switch]$Run
)

$ErrorActionPreference = "Stop"

Write-Host "Style and Beauty Azure pre-deployment checklist"
Write-Host "Env file: $EnvFile"
Write-Host "Compose file: $ComposeFile"
Write-Host "Image tag: $ImageTag"

if (-not (Test-Path $EnvFile)) {
    throw "Missing $EnvFile. Create it from .env.azure.example and store real secrets in Azure, not in Git."
}

docker compose -f docker-compose.yml config --quiet
docker compose --env-file $EnvFile -f $ComposeFile config --quiet

Write-Host "Compose configuration is valid."
Write-Host "Required manual checks before deployment:"
Write-Host "1. Firebase exposed key revoked and replaced with a new Azure secret."
Write-Host "2. Docker Hub images built and pushed with tag $ImageTag."
Write-Host "3. PostgreSQL/Mongo connection strings point to managed services."
Write-Host "4. CORS includes only the final frontend domains."
Write-Host "5. Protected endpoints were validated with a fresh Firebase ID token."

if ($Run) {
    docker compose --env-file $EnvFile -f $ComposeFile pull
    docker compose --env-file $EnvFile -f $ComposeFile up -d --remove-orphans
    docker compose --env-file $EnvFile -f $ComposeFile ps
} else {
    Write-Host "Dry run only. Re-run with -Run for a VM/docker-compose deployment."
}

