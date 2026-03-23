/**
 * Deposits a test bribe from the deployer account into BribeVault for epoch 1.
 * Run: node scripts/deposit_bribe.mjs [amount_uvm] [epoch_id]
 */
import { SigningCosmWasmClient } from "@cosmjs/cosmwasm-stargate";
import { DirectSecp256k1HdWallet } from "@cosmjs/proto-signing";
import { GasPrice, coins } from "@cosmjs/stargate";

const RPC = "http://localhost:26657";
const DENOM = "uvm";
const BRIBE_VAULT = "init1f6jlx7d9y408tlzue7r2qcf79plp549n30yzqjajjud8vm7m4vdsnygfaq";
const MNEMONIC = "video bag journey sail goddess toward foster blind daughter vicious stool dutch regret nothing truck junior nest plastic swap kick apple people panther critic";

const AMOUNT = process.argv[2] ?? "10000000"; // default 10 VM
const EPOCH_ID = Number(process.argv[3] ?? "1");

const wallet = await DirectSecp256k1HdWallet.fromMnemonic(MNEMONIC, { prefix: "init" });
const [account] = await wallet.getAccounts();
console.log("Protocol (depositor):", account.address);
console.log("Amount:", Number(AMOUNT) / 1_000_000, "VM →", BRIBE_VAULT, "epoch", EPOCH_ID);

const client = await SigningCosmWasmClient.connectWithSigner(RPC, wallet, {
  gasPrice: GasPrice.fromString(`0.025${DENOM}`),
});

const result = await client.execute(
  account.address,
  BRIBE_VAULT,
  { deposit_bribe: { epoch_id: EPOCH_ID } },
  "auto",
  undefined,
  coins(AMOUNT, DENOM) // funds sent with the message
);
console.log("✓ Bribe deposited! TX:", result.transactionHash);

// Verify
const q = Buffer.from(JSON.stringify({ bribe_offers: { epoch_id: EPOCH_ID } })).toString("base64");
const res = await fetch(`http://localhost:1317/cosmwasm/wasm/v1/contract/${BRIBE_VAULT}/smart/${q}`);
const data = await res.json();
console.log("Current offers:", JSON.stringify(data.data?.offers, null, 2));
