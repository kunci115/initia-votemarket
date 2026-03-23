#!/usr/bin/env node
/**
 * Deploy Votemarket contracts to votemarket-1 rollup
 * Usage: node scripts/deploy_contracts.mjs [--rpc http://localhost:26657]
 *
 * Requires the rollup to be running (RPC accessible).
 * Uses the deployer key from wallet-keys.json.
 */
import { readFileSync, writeFileSync } from "fs";
import { createReadStream } from "fs";
import { DirectSecp256k1HdWallet } from "@cosmjs/proto-signing";
import { SigningCosmWasmClient } from "@cosmjs/cosmwasm-stargate";
import { GasPrice } from "@cosmjs/stargate";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEPLOY_DIR = path.resolve(__dirname, "..");
const CONTRACTS_DIR = path.resolve(DEPLOY_DIR, "..", "contracts", "target", "wasm32-unknown-unknown", "release");

// Parse args
const args = process.argv.slice(2);
const rpcArg = args.indexOf("--rpc");
const RPC_URL = rpcArg >= 0 ? args[rpcArg + 1] : "http://localhost:26657";
const REST_URL = RPC_URL.replace("26657", "1317");

const DENOM = "uvm";
const GAS_PRICE = GasPrice.fromString(`0.025${DENOM}`);

async function main() {
  console.log(`Connecting to rollup RPC: ${RPC_URL}`);

  // Load deployer wallet (has genesis allocation of 1000000000uvm)
  const keys = JSON.parse(readFileSync(path.join(DEPLOY_DIR, "wallet-keys.json"), "utf8"));
  const deployer = keys.deployer;
  console.log(`Deployer address: ${deployer.address}`);

  const wallet = await DirectSecp256k1HdWallet.fromMnemonic(deployer.mnemonic, {
    prefix: "init",
  });

  const client = await SigningCosmWasmClient.connectWithSigner(RPC_URL, wallet, {
    gasPrice: GAS_PRICE,
  });

  // Check balance
  const balance = await client.getBalance(deployer.address, DENOM);
  console.log(`Balance: ${balance.amount} ${balance.denom}`);
  if (BigInt(balance.amount) < 10_000_000n) {
    throw new Error("Insufficient balance — need at least 10 UVM for deployment");
  }

  const adminAddress = deployer.address;

  // ── 1. Store epoch-controller ─────────────────────────────────────────────
  console.log("\n[1/6] Storing epoch-controller...");
  const epochWasm = readFileSync(path.join(CONTRACTS_DIR, "epoch_controller_opt.wasm"));
  const epochStoreResult = await client.upload(deployer.address, epochWasm, "auto");
  const epochCodeId = epochStoreResult.codeId;
  console.log(`  epoch-controller code_id: ${epochCodeId} (tx: ${epochStoreResult.transactionHash})`);

  // ── 2. Store bribe-vault ──────────────────────────────────────────────────
  console.log("[2/6] Storing bribe-vault...");
  const vaultWasm = readFileSync(path.join(CONTRACTS_DIR, "bribe_vault_opt.wasm"));
  const vaultStoreResult = await client.upload(deployer.address, vaultWasm, "auto");
  const vaultCodeId = vaultStoreResult.codeId;
  console.log(`  bribe-vault code_id: ${vaultCodeId} (tx: ${vaultStoreResult.transactionHash})`);

  // ── 3. Store vote-registry ────────────────────────────────────────────────
  console.log("[3/6] Storing vote-registry...");
  const regWasm = readFileSync(path.join(CONTRACTS_DIR, "vote_registry_opt.wasm"));
  const regStoreResult = await client.upload(deployer.address, regWasm, "auto");
  const regCodeId = regStoreResult.codeId;
  console.log(`  vote-registry code_id: ${regCodeId} (tx: ${regStoreResult.transactionHash})`);

  // ── 4. Instantiate epoch-controller ──────────────────────────────────────
  console.log("\n[4/6] Instantiating epoch-controller...");
  const epochInit = {
    admin: adminAddress,
    min_distribution_blocks: 200,
  };
  const epochResult = await client.instantiate(
    deployer.address,
    epochCodeId,
    epochInit,
    "Votemarket Epoch Controller",
    "auto",
    { admin: adminAddress }
  );
  const epochAddr = epochResult.contractAddress;
  console.log(`  epoch-controller: ${epochAddr} (tx: ${epochResult.transactionHash})`);

  // ── 5. Instantiate bribe-vault (needs epoch-controller + vote-registry addr)
  //     We use a placeholder vote-registry addr first, then update via migrate/admin
  console.log("[5/6] Instantiating bribe-vault...");
  // We need vote-registry address first — instantiate with placeholder then update
  // For simplicity: use admin addr as temporary vote_registry, update after #6
  const vaultInitTemp = {
    admin: adminAddress,
    epoch_controller: epochAddr,
    vote_registry: adminAddress, // placeholder — updated below
    treasury: adminAddress,
    fee_bps: 400,
    denom: DENOM,
  };
  const vaultResult = await client.instantiate(
    deployer.address,
    vaultCodeId,
    vaultInitTemp,
    "Votemarket Bribe Vault",
    "auto",
    { admin: adminAddress }
  );
  const vaultAddr = vaultResult.contractAddress;
  console.log(`  bribe-vault: ${vaultAddr} (tx: ${vaultResult.transactionHash})`);

  // ── 6. Instantiate vote-registry ──────────────────────────────────────────
  console.log("[6/6] Instantiating vote-registry...");
  const regInit = {
    admin: adminAddress,
    epoch_controller: epochAddr,
    bribe_vault: vaultAddr,
    vip_query_path: "/initia.vip.v1.Query/VipScore",
  };
  const regResult = await client.instantiate(
    deployer.address,
    regCodeId,
    regInit,
    "Votemarket Vote Registry",
    "auto",
    { admin: adminAddress }
  );
  const regAddr = regResult.contractAddress;
  console.log(`  vote-registry: ${regAddr} (tx: ${regResult.transactionHash})`);

  // ── Update bribe-vault vote_registry address ──────────────────────────────
  console.log("\nUpdating bribe-vault with real vote-registry address...");
  const updateMsg = { update_config: { vote_registry: regAddr } };
  await client.execute(deployer.address, vaultAddr, updateMsg, "auto");
  console.log("  Done.");

  // ── Save addresses ────────────────────────────────────────────────────────
  const addresses = {
    epoch_controller: epochAddr,
    bribe_vault: vaultAddr,
    vote_registry: regAddr,
    code_ids: {
      epoch_controller: epochCodeId,
      bribe_vault: vaultCodeId,
      vote_registry: regCodeId,
    },
    deployer: deployer.address,
    rpc: RPC_URL,
    rest: REST_URL,
    denom: DENOM,
  };

  const outPath = path.join(DEPLOY_DIR, "contract-addresses.json");
  writeFileSync(outPath, JSON.stringify(addresses, null, 2));
  console.log(`\nAddresses saved to: ${outPath}`);
  console.log(JSON.stringify(addresses, null, 2));

  // Update submission.json
  const submissionPath = path.resolve(DEPLOY_DIR, "..", ".initia", "submission.json");
  try {
    const submission = JSON.parse(readFileSync(submissionPath, "utf8"));
    submission.contracts.epoch_controller = epochAddr;
    submission.contracts.bribe_vault = vaultAddr;
    submission.contracts.vote_registry = regAddr;
    writeFileSync(submissionPath, JSON.stringify(submission, null, 2));
    console.log("submission.json updated with contract addresses.");
  } catch (e) {
    console.warn("Could not update submission.json:", e.message);
  }
}

main().catch((e) => {
  console.error("\nDeploy failed:", e.message);
  process.exit(1);
});
