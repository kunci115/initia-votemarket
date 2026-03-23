import { SigningCosmWasmClient } from "@cosmjs/cosmwasm-stargate";
import { DirectSecp256k1HdWallet } from "@cosmjs/proto-signing";
import { GasPrice } from "@cosmjs/stargate";

const RPC = "http://localhost:26657";
const DENOM = "uvm";
const EPOCH_CTRL = "init153r9tg33had5c5s54sqzn879xww2q2egektyqnpj6nwxt8wls70qqzjz9a";
const MNEMONIC = "video bag journey sail goddess toward foster blind daughter vicious stool dutch regret nothing truck junior nest plastic swap kick apple people panther critic";

const ACTION = process.argv[2]; // snapshot | distribution | close
const MSG_MAP = {
  snapshot:     { advance_to_snapshot: {} },
  distribution: { advance_to_distribution: {} },
  close:        { close_epoch: {} },
};
if (!MSG_MAP[ACTION]) {
  console.error("Usage: node advance_epoch.mjs snapshot|distribution|close");
  process.exit(1);
}

const wallet = await DirectSecp256k1HdWallet.fromMnemonic(MNEMONIC, { prefix: "init" });
const [account] = await wallet.getAccounts();
const client = await SigningCosmWasmClient.connectWithSigner(RPC, wallet, {
  gasPrice: GasPrice.fromString(`0.025${DENOM}`),
});

console.log(`Advancing epoch → ${ACTION}...`);
const result = await client.execute(account.address, EPOCH_CTRL, MSG_MAP[ACTION], "auto");
console.log("✓ TX:", result.transactionHash);

const q = Buffer.from(JSON.stringify({ current_epoch: {} })).toString("base64");
const res = await fetch(`http://localhost:1317/cosmwasm/wasm/v1/contract/${EPOCH_CTRL}/smart/${q}`);
const data = await res.json();
console.log("Epoch now:", JSON.stringify(data.data?.epoch, null, 2));
