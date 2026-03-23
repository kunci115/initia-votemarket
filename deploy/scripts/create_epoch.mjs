import { SigningCosmWasmClient } from "@cosmjs/cosmwasm-stargate";
import { DirectSecp256k1HdWallet } from "@cosmjs/proto-signing";
import { GasPrice } from "@cosmjs/stargate";

const RPC = "http://localhost:26657";
const EPOCH_CONTROLLER = "init153r9tg33had5c5s54sqzn879xww2q2egektyqnpj6nwxt8wls70qqzjz9a";
const DENOM = "uvm";
const MNEMONIC = "video bag journey sail goddess toward foster blind daughter vicious stool dutch regret nothing truck junior nest plastic swap kick apple people panther critic";

const wallet = await DirectSecp256k1HdWallet.fromMnemonic(MNEMONIC, { prefix: "init" });
const [account] = await wallet.getAccounts();
console.log("Sender:", account.address);

const client = await SigningCosmWasmClient.connectWithSigner(RPC, wallet, {
  gasPrice: GasPrice.fromString(`0.025${DENOM}`),
});

console.log("Calling CreateEpoch on", EPOCH_CONTROLLER);
const result = await client.execute(account.address, EPOCH_CONTROLLER, { create_epoch: {} }, "auto");
console.log("✓ Epoch created! TX:", result.transactionHash);

// Query the new epoch
const query = Buffer.from(JSON.stringify({ current_epoch: {} })).toString("base64");
const res = await fetch(`http://localhost:1317/cosmwasm/wasm/v1/contract/${EPOCH_CONTROLLER}/smart/${query}`);
const data = await res.json();
console.log("Current epoch:", JSON.stringify(data.data?.epoch, null, 2));
