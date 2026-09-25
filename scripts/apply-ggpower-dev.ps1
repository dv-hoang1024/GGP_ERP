[CmdletBinding()]
param(
	[string]$Container = "devcontainer-frappe-1",
	[string]$Site = "ggpower.localhost",
	[string]$Url = "http://ggpower.localhost:8002",
	[switch]$ValidateOnly
)

$ErrorActionPreference = "Stop"
$appRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot ".."))
$source = Join-Path $appRoot "gg_power"
$benchPath = "/workspace/development/frappe-bench"
$containerAppPath = "$benchPath/apps/gg_power/gg_power"

$plan = [ordered]@{
	container = $Container
	site = $Site
	url = $Url
	source = $source
	target = $containerAppPath
}

if ($ValidateOnly) {
	$plan | ConvertTo-Json -Compress
	exit 0
}

if (-not (Test-Path -LiteralPath $source -PathType Container)) {
	throw "Application source was not found: $source"
}

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
	throw "Docker was not found in PATH."
}

function Invoke-DockerCommand {
	param([Parameter(Mandatory = $true)][string[]]$Arguments)

	Write-Host "> docker $($Arguments -join ' ')" -ForegroundColor DarkGray
	& docker @Arguments
	if ($LASTEXITCODE -ne 0) {
		throw "Docker command failed with exit code $LASTEXITCODE."
	}
}

$running = & docker inspect --format "{{.State.Running}}" $Container 2>$null
if ($LASTEXITCODE -ne 0 -or $running -ne "true") {
	throw "Container '$Container' is not running. Start Docker Desktop and the development environment first."
}

Write-Host "Syncing GGPower ERP into the container..." -ForegroundColor Cyan
Invoke-DockerCommand -Arguments @("cp", "$source\.", "${Container}:$containerAppPath")

Write-Host "Building assets and updating the site..." -ForegroundColor Cyan
Invoke-DockerCommand -Arguments @("exec", "-w", $benchPath, $Container, "bench", "build", "--app", "gg_power")
Invoke-DockerCommand -Arguments @("exec", "-w", $benchPath, $Container, "bench", "--site", $Site, "migrate")
Invoke-DockerCommand -Arguments @("exec", "-w", $benchPath, $Container, "bench", "--site", $Site, "execute", "gg_power.setup.install.apply_branding")
Invoke-DockerCommand -Arguments @("exec", "-w", $benchPath, $Container, "bench", "--site", $Site, "clear-cache")
Invoke-DockerCommand -Arguments @("exec", "-w", $benchPath, $Container, "bench", "--site", $Site, "clear-website-cache")

Write-Host "Restarting Bench..." -ForegroundColor Cyan
Invoke-DockerCommand -Arguments @("restart", $Container)
Start-Sleep -Seconds 2
Invoke-DockerCommand -Arguments @(
	"exec", "-d", "-w", $benchPath, $Container,
	"bash", "-lc", "bench start > /tmp/ggpower-bench.log 2>&1"
)

$targetUri = [Uri]$Url
$port = if ($targetUri.IsDefaultPort) { "" } else { ":$($targetUri.Port)" }
$healthUrl = "$($targetUri.Scheme)://127.0.0.1$port/login"
$deadline = (Get-Date).AddSeconds(90)
$ready = $false

Write-Host "Waiting for the site to become ready..." -ForegroundColor Cyan
do {
	try {
		$response = Invoke-WebRequest -UseBasicParsing -Uri $healthUrl -Headers @{ Host = $Site } -TimeoutSec 3
		if ($response.StatusCode -eq 200) {
			$ready = $true
			break
		}
	} catch {
		Start-Sleep -Seconds 1
	}
} while ((Get-Date) -lt $deadline)

if (-not $ready) {
	throw "The site did not respond within 90 seconds. Check logs with: docker exec $Container tail -n 100 /tmp/ggpower-bench.log"
}

Write-Host "GGPower ERP is ready: $Url" -ForegroundColor Green
Write-Host "Reload the browser tab once to receive the new assets." -ForegroundColor Green
