import "dotenv/config";
import { AgentWallet } from "./wallet";
import { ContractClient } from "./contracts";
import { EpochOptimizer } from "./optimizer";
import { logger } from "./logger";

const POLL_INTERVAL_MS = Number(process.env.POLL_INTERVAL_MS ?? 30000);

async function main() {
  logger.info("Starting Votemarket AI Yield Agent...");

  const wallet = await AgentWallet.fromMnemonic(
    process.env.AGENT_MNEMONIC!,
    process.env.RPC_URL!,
    process.env.CHAIN_ID!
  );

  const contracts = new ContractClient({
    lcdUrl: process.env.LCD_URL!,
    epochController: process.env.EPOCH_CONTROLLER_ADDRESS!,
    bribeVault: process.env.BRIBE_VAULT_ADDRESS!,
    voteRegistry: process.env.VOTE_REGISTRY_ADDRESS!,
  });

  const optimizer = new EpochOptimizer(wallet, contracts);

  logger.info(`Agent address: ${wallet.address}`);
  logger.info(`Polling every ${POLL_INTERVAL_MS / 1000}s`);

  // Main loop
  while (true) {
    try {
      await optimizer.tick();
    } catch (err) {
      logger.error("Tick error:", err);
    }
    await sleep(POLL_INTERVAL_MS);
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

main().catch((err) => {
  logger.error("Fatal error:", err);
  process.exit(1);
});
