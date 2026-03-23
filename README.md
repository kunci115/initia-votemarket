# Votemarket.init

**VIP gauge bribe marketplace with AI yield optimization — built on Initia.**

## What it is

Protocols bid INIT tokens for user VIP gauge voting power. Users earn passive yield by delegating their votes. An AI agent can manage votes autonomously every epoch, maximizing yield via session key auto-signing.

Think: [Votium](https://votium.app) for Curve gauge voters — but native to Initia's VIP system.

## Tracks

- DeFi
- AI

## How it works

```
1. Protocols deposit INIT → BribeVault (per epoch)
2. Users delegate VIP votes → VoteRegistry
3. Epoch closes → VIP scores snapshot → vote weights finalized
4. Users (or AI agent) claim proportional INIT rewards
5. 4% fee → protocol treasury
```

### AI Agent

- Scores all bribe offers each epoch (yield/vote ratio, deposit recency, protocol reliability)
- Autonomously delegates and claims on behalf of users who opt in
- Uses x/authz session keys — agent cannot redirect funds or escalate permissions
- User can revoke at any time in one click

## Initia-native features used

- **Auto-signing / Session UX** — AI agent uses session keys registered via InterwovenKit
- **Initia Usernames (.init)** — displayed in wallet connect and user panel

## Tech stack

| Layer | Stack |
|-------|-------|
| Smart Contracts | CosmWasm (Rust) |
| Frontend | Next.js + InterwovenKit React |
| AI Agent | TypeScript / Node.js |
| Chain | Initia Minitia (WasmVM rollup) |

## Contracts

| Contract | Description |
|----------|-------------|
| `epoch-controller` | Epoch state machine (Deposit → Snapshot → Distribution → Closed) |
| `bribe-vault` | Bribe escrow, fee collection, reward distribution |
| `vote-registry` | Delegations, VIP score snapshots, session key registry |

## Project structure

```
initia-votemarket/
├── .initia/
│   └── submission.json
├── contracts/
│   ├── epoch-controller/
│   ├── bribe-vault/
│   └── vote-registry/
├── frontend/          # Next.js + InterwovenKit
├── agent/             # AI yield optimization agent
└── README.md
```

## Live Deployment

| | |
|---|---|
| **Rollup Chain ID** | `votemarket-1` |
| **Bridge ID** | 1696 (on `initiation-2`) |
| **L1 Bridge Address** | `init1zu5ztw75v6q6jwrm2kusc5vxwavn4w9qx3v77kze2exm0tnpldfs97d382` |
| **epoch_controller** | `init153r9tg33had5c5s54sqzn879xww2q2egektyqnpj6nwxt8wls70qqzjz9a` |
| **bribe_vault** | `init1f6jlx7d9y408tlzue7r2qcf79plp549n30yzqjajjud8vm7m4vdsnygfaq` |
| **vote_registry** | `init124tapgv8wsn5t3rv2cvywh4ckkmj6mc6fkya005qjmshnzewwm9q0jqen7` |

## Running locally

### 1. Start the rollup

Requires Docker Desktop and the `votemarket-weave` image built from `deploy/`.

```bash
cd deploy

# Build the image (only once)
docker build -t votemarket-weave .

# Start rollup (persistent volumes — survives restarts)
docker run -d --name votemarket-rollup \
  -v votemarket_root:/root \
  -p 26656:26656 -p 26657:26657 -p 1317:1317 -p 9090:9090 \
  votemarket-weave

# After the launch script completes, start the chain node:
docker exec -d votemarket-rollup sh -c \
  "LD_LIBRARY_PATH=/root/.weave/data/miniwasm@v1.2.11 \
   /root/.weave/data/miniwasm@v1.2.11/minitiad start \
   --home /root/.minitia >> /root/minitiad.log 2>&1"

# Verify it's producing blocks:
curl http://localhost:26657/status | jq .result.sync_info.latest_block_height
```

### 2. Deploy contracts

Requires Node.js 18+. Contracts are already deployed (see above), but to redeploy:

```bash
cd deploy
npm install

# Build optimized wasm (requires Docker)
docker run --rm \
  -v "$(pwd)/../optimizer-workspace":/code \
  --mount type=volume,source=cw_target_cache,target=/target \
  --mount type=volume,source=cw_registry_cache,target=/usr/local/cargo/registry \
  cosmwasm/workspace-optimizer:0.15.1

# Deploy
node scripts/deploy_contracts.mjs
# Writes contract addresses to contract-addresses.json and submission.json
```

> **Note:** Contracts must be compiled with Rust ≤ 1.81 (or the cosmwasm optimizer image). Rust 1.82+ enables WebAssembly `bulk-memory` by default, which is blocked by the CosmWasm VM's Gatekeeper.

### 3. Frontend

```bash
cd frontend
npm install
# .env.local is pre-filled with deployed addresses
npm run dev
# Open http://localhost:3000
```

### 4. AI Agent

```bash
cd agent
npm install
# .env is pre-filled with deployed addresses and deployer key
npm start
```

## Security

- Session key `register`/`revoke` never accept `on_behalf_of` — user-only
- `claim_rewards` with `on_behalf_of` always sends funds to beneficiary, never to agent
- Checks-effects-interactions pattern on all fund transfers
- Bribe deposits are increase-only (no rug by protocol)
- Minimum distribution window enforced before epoch close

## Demo

_Demo video link — to be added before submission_
