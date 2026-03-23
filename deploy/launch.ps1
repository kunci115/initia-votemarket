# Votemarket Rollup Launch Script
# Run this in PowerShell (NOT Git Bash) from the deploy/ folder:
#   cd initia-votemarket/deploy
#   .\launch.ps1

Write-Host "`n=== Votemarket.init Rollup Launch ===" -ForegroundColor Cyan
Write-Host "Chain ID: votemarket-1 | VM: WasmVM | L1: initiation-2`n"

# Step 1: Check Docker
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Host "ERROR: Docker not found. Install Docker Desktop first." -ForegroundColor Red
    exit 1
}

Write-Host "[1/4] Docker found. Building image..." -ForegroundColor Yellow
docker build -t votemarket-weave .
if ($LASTEXITCODE -ne 0) { Write-Host "Build failed." -ForegroundColor Red; exit 1 }

# Step 2: Show addresses to fund
Write-Host "`n[2/4] Fund these addresses on the Initia testnet faucet:" -ForegroundColor Yellow
Write-Host "  Faucet: https://faucet.testnet.initia.xyz" -ForegroundColor Cyan
Write-Host ""
$config = Get-Content rollup-config.json | ConvertFrom-Json
Write-Host "  validator:        $($config.system_keys.validator.l1_address)"
Write-Host "  bridge_executor:  $($config.system_keys.bridge_executor.l1_address)"
Write-Host "  output_submitter: $($config.system_keys.output_submitter.l1_address)"
Write-Host "  batch_submitter:  $($config.system_keys.batch_submitter.l1_address)"
Write-Host "  challenger:       $($config.system_keys.challenger.l1_address)"

Write-Host "`nPress ENTER after funding all 5 addresses..." -ForegroundColor Yellow
Read-Host

# Step 3: Launch rollup
Write-Host "[3/4] Launching votemarket-1 rollup..." -ForegroundColor Yellow
Write-Host "(This will take 5-10 minutes. The rollup will register on L1 and sync.)`n"

docker run -it --rm `
    -v votemarket_minitia:/root/.minitia `
    -v votemarket_opinit:/root/.opinit `
    -p 26656:26656 `
    -p 26657:26657 `
    -p 1317:1317 `
    -p 9090:9090 `
    votemarket-weave `
    weave rollup launch --with-config /app/rollup-config.json --vm wasm

# Step 4: Show results
Write-Host "`n[4/4] Rollup launched!" -ForegroundColor Green
Write-Host "Chain ID:   votemarket-1" -ForegroundColor Cyan
Write-Host "RPC:        http://localhost:26657" -ForegroundColor Cyan
Write-Host "REST:       http://localhost:1317" -ForegroundColor Cyan
Write-Host "`nUpdate .initia/submission.json with the bridge transaction hash from above."
