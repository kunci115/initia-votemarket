#!/bin/bash
# Votemarket Rollup Launch Script
# Run this in a REAL terminal (not Claude Code shell) from the deploy/ folder:
#   cd initia-votemarket/deploy
#   bash launch.sh

set -e

echo ""
echo "=== Votemarket.init Rollup Launch ==="
echo "Chain ID: votemarket-1 | VM: WasmVM | L1: initiation-2"
echo ""

# Build image
echo "[1/4] Building Docker image..."
docker build -t votemarket-weave .

# Show addresses to fund
echo ""
echo "[2/4] Fund these addresses on Initia testnet faucet:"
echo "  Faucet: https://faucet.testnet.initia.xyz"
echo ""
python3 -c "
import json
with open('rollup-config.json') as f:
    c = json.load(f)
k = c['system_keys']
for role in ['validator','bridge_executor','output_submitter','batch_submitter','challenger']:
    print(f'  {role:<20} {k[role][\"l1_address\"]}')
" 2>/dev/null || cat rollup-config.json | grep -A2 '"validator"\|"bridge_executor"\|"output_submitter"\|"batch_submitter"\|"challenger"' | grep l1_address

echo ""
read -p "Press ENTER after funding all 5 addresses..."

# Launch rollup
echo ""
echo "[3/4] Launching votemarket-1 rollup..."
echo "(This will take 5-10 minutes)"
echo ""

docker run -it --rm \
    -v votemarket_minitia:/root/.minitia \
    -v votemarket_opinit:/root/.opinit \
    -p 26656:26656 \
    -p 26657:26657 \
    -p 1317:1317 \
    -p 9090:9090 \
    votemarket-weave \
    weave rollup launch --with-config /app/rollup-config.json --vm wasm

echo ""
echo "[4/4] Done!"
echo "  Chain ID: votemarket-1"
echo "  RPC:      http://localhost:26657"
echo "  REST:     http://localhost:1317"
echo ""
echo "Update .initia/submission.json with the bridge tx hash shown above."
