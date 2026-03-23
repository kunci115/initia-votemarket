/**
 * Generate system account wallets for Votemarket rollup deployment.
 * Outputs rollup-config.json with filled mnemonics and addresses.
 *
 * Usage:
 *   node deploy/scripts/gen-wallets.mjs
 *
 * Then fund each INIT address shown using the Initia testnet faucet:
 *   https://faucet.testnet.initia.xyz
 *
 * Minimum recommended balances:
 *   validator:        0.5 INIT (500000 uinit)
 *   bridge_executor:  1 INIT   (1000000 uinit)
 *   output_submitter: 1 INIT   (1000000 uinit)
 *   batch_submitter:  1 INIT   (1000000 uinit)
 *   challenger:       0.5 INIT (500000 uinit)
 */

import { DirectSecp256k1HdWallet } from "@cosmjs/proto-signing";
import { Bip39, Random } from "@cosmjs/crypto";
import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const TEMPLATE_PATH = join(__dirname, "../rollup-config.template.json");
const OUTPUT_PATH = join(__dirname, "../rollup-config.json");
const KEYS_PATH = join(__dirname, "../wallet-keys.json"); // KEEP SECRET — add to .gitignore

async function generateWallet(role) {
  const mnemonic = Bip39.encode(Random.getBytes(32)).toString();
  const wallet = await DirectSecp256k1HdWallet.fromMnemonic(mnemonic, {
    prefix: "init",
  });
  const [account] = await wallet.getAccounts();
  return {
    role,
    mnemonic,
    address: account.address,
  };
}

async function main() {
  const roles = [
    "validator",
    "bridge_executor",
    "output_submitter",
    "batch_submitter",
    "challenger",
    "deployer",
  ];

  console.log("Generating wallets for Votemarket rollup...\n");

  const wallets = {};
  for (const role of roles) {
    wallets[role] = await generateWallet(role);
    console.log(`[${role}]`);
    console.log(`  Address:  ${wallets[role].address}`);
    console.log(`  Mnemonic: ${wallets[role].mnemonic}\n`);
  }

  // Save keys to wallet-keys.json (NEVER commit this)
  writeFileSync(KEYS_PATH, JSON.stringify(wallets, null, 2));
  console.log(`Keys saved to: deploy/wallet-keys.json  ⚠ NEVER COMMIT THIS FILE`);

  // Fill in the config template
  let config = readFileSync(TEMPLATE_PATH, "utf8");
  config = config
    .replace(/__VALIDATOR_L1__/g, wallets.validator.address)
    .replace(/__VALIDATOR_L2__/g, wallets.validator.address)
    .replace(/__VALIDATOR_MNEMONIC__/g, wallets.validator.mnemonic)
    .replace(/__BRIDGE_EXECUTOR_L1__/g, wallets.bridge_executor.address)
    .replace(/__BRIDGE_EXECUTOR_L2__/g, wallets.bridge_executor.address)
    .replace(/__BRIDGE_EXECUTOR_MNEMONIC__/g, wallets.bridge_executor.mnemonic)
    .replace(/__OUTPUT_SUBMITTER_L1__/g, wallets.output_submitter.address)
    .replace(/__OUTPUT_SUBMITTER_L2__/g, wallets.output_submitter.address)
    .replace(/__OUTPUT_SUBMITTER_MNEMONIC__/g, wallets.output_submitter.mnemonic)
    .replace(/__BATCH_SUBMITTER_L1__/g, wallets.batch_submitter.address)
    .replace(/__BATCH_SUBMITTER_L2__/g, wallets.batch_submitter.address)
    .replace(/__BATCH_SUBMITTER_MNEMONIC__/g, wallets.batch_submitter.mnemonic)
    .replace(/__CHALLENGER_L1__/g, wallets.challenger.address)
    .replace(/__CHALLENGER_L2__/g, wallets.challenger.address)
    .replace(/__CHALLENGER_MNEMONIC__/g, wallets.challenger.mnemonic)
    .replace(/__DEPLOYER_ADDRESS__/g, wallets.deployer.address);

  writeFileSync(OUTPUT_PATH, config);
  console.log(`\nConfig written to: deploy/rollup-config.json`);

  console.log("\n=== NEXT STEP: Fund these addresses on Initia testnet ===");
  console.log("Faucet: https://faucet.testnet.initia.xyz\n");
  for (const role of roles.filter((r) => r !== "deployer")) {
    console.log(`  ${wallets[role].address}  (${role})`);
  }
  console.log(
    "\nAfter funding, run:\n  cd deploy && docker compose up\n"
  );
}

main().catch(console.error);
