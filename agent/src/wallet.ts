import { DirectSecp256k1HdWallet } from "@cosmjs/proto-signing";
import { SigningStargateClient, GasPrice } from "@cosmjs/stargate";
import { MsgExecuteContract } from "cosmjs-types/cosmwasm/wasm/v1/tx";

export class AgentWallet {
  public readonly address: string;
  private readonly client: SigningStargateClient;

  private constructor(address: string, client: SigningStargateClient) {
    this.address = address;
    this.client = client;
  }

  static async fromMnemonic(
    mnemonic: string,
    rpcUrl: string,
    chainId: string
  ): Promise<AgentWallet> {
    const wallet = await DirectSecp256k1HdWallet.fromMnemonic(mnemonic, {
      prefix: "init",
    });
    const [account] = await wallet.getAccounts();
    const client = await SigningStargateClient.connectWithSigner(rpcUrl, wallet, {
      gasPrice: GasPrice.fromString("0.025uinit"),
    });
    return new AgentWallet(account.address, client);
  }

  /**
   * Execute a CosmWasm contract on behalf of a user via x/authz MsgExec.
   * The agent's wallet pays gas; funds go to the user (beneficiary).
   */
  async executeOnBehalfOf(
    contractAddress: string,
    msg: Record<string, unknown>,
    grantee: string // user address
  ): Promise<string> {
    // Build inner MsgExecuteContract
    const innerMsg = {
      typeUrl: "/cosmwasm.wasm.v1.MsgExecuteContract",
      value: MsgExecuteContract.fromPartial({
        sender: grantee,
        contract: contractAddress,
        msg: Buffer.from(JSON.stringify(msg)),
        funds: [],
      }),
    };

    // Wrap in MsgExec (x/authz)
    const execMsg = {
      typeUrl: "/cosmos.authz.v1beta1.MsgExec",
      value: {
        grantee: this.address,
        msgs: [innerMsg],
      },
    };

    const result = await this.client.signAndBroadcast(
      this.address,
      [execMsg],
      "auto"
    );

    if (result.code !== 0) {
      throw new Error(`Tx failed: ${result.rawLog}`);
    }

    return result.transactionHash;
  }

  /**
   * Direct contract execution (for admin functions called by agent itself)
   */
  async execute(
    contractAddress: string,
    msg: Record<string, unknown>
  ): Promise<string> {
    const result = await this.client.execute(
      this.address,
      contractAddress,
      msg,
      "auto"
    );
    return result.transactionHash;
  }
}
