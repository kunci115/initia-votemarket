#!/bin/bash
# Entrypoint: use expect to automate weave's interactive TUI, then keep running
set -e

LOG=/root/launch.log
echo "Starting weave rollup launch (automated via expect)..." | tee "$LOG"

expect /app/autolaunch.expect 2>&1 | tee -a "$LOG"

echo "" | tee -a "$LOG"
echo "=== Launch complete. Waiting for rollup node... ===" | tee -a "$LOG"

# Wait for the RPC to become available (minitiad started by weave runs in background)
for i in $(seq 1 120); do
    if curl -sf http://localhost:26657/status > /dev/null 2>&1; then
        echo "=== Rollup RPC ready at :26657 ===" | tee -a "$LOG"
        break
    fi
    sleep 2
done

echo "=== Rollup is live. Keeping container alive... ===" | tee -a "$LOG"
# Keep container alive; minitiad runs as background process started by weave
exec tail -f /dev/null
