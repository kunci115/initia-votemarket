import axios from "axios";

export interface BribeOffer {
  epoch_id: number;
  protocol: string;
  total_amount: string;
  deposited_at_height: number;
}

export interface EpochState {
  id: number;
  phase: "Deposit" | "Snapshot" | "Distribution" | "Closed";
  deposit_start: number;
  snapshot_height: number | null;
  distribution_start: number | null;
  closed_at: number | null;
}

export interface SessionKeyRecord {
  user: string;
  agent: string;
  can_delegate: boolean;
  can_claim: boolean;
  allowed_protocols: string[];
}

export interface ContractClientConfig {
  lcdUrl: string;
  epochController: string;
  bribeVault: string;
  voteRegistry: string;
}

export class ContractClient {
  constructor(private readonly cfg: ContractClientConfig) {}

  private async query<T>(contractAddress: string, msg: Record<string, unknown>): Promise<T> {
    const encoded = Buffer.from(JSON.stringify(msg)).toString("base64");
    const res = await axios.get(
      `${this.cfg.lcdUrl}/cosmwasm/wasm/v1/contract/${contractAddress}/smart/${encoded}`
    );
    return res.data.data as T;
  }

  async getCurrentEpoch(): Promise<EpochState> {
    const res = await this.query<{ epoch: EpochState }>(
      this.cfg.epochController,
      { current_epoch: {} }
    );
    return res.epoch;
  }

  async getBribeOffers(epochId: number): Promise<BribeOffer[]> {
    const res = await this.query<{ offers: BribeOffer[] }>(
      this.cfg.bribeVault,
      { bribe_offers: { epoch_id: epochId } }
    );
    return res.offers;
  }

  async getUserDelegation(epochId: number, user: string) {
    return this.query<{ delegation: Record<string, unknown> | null }>(
      this.cfg.voteRegistry,
      { user_delegation: { epoch_id: epochId, user } }
    );
  }

  async getUserReward(epochId: number, user: string) {
    return this.query<{ amount: string; claimed: boolean }>(
      this.cfg.bribeVault,
      { user_reward: { epoch_id: epochId, user } }
    );
  }

  /**
   * Get all users who have registered session keys by scanning vote-registry.
   * In production: maintain an off-chain index or use event streaming.
   * For hackathon: use a pre-configured list of enrolled users.
   */
  async getEnrolledUsers(): Promise<SessionKeyRecord[]> {
    // TODO: replace with event index or subgraph
    const envUsers = process.env.ENROLLED_USERS ?? "";
    if (!envUsers) return [];

    const users = envUsers.split(",").map((u) => u.trim());
    const records: SessionKeyRecord[] = [];

    for (const user of users) {
      try {
        const res = await this.query<{ record: SessionKeyRecord | null }>(
          this.cfg.voteRegistry,
          { session_key: { user, agent: process.env.AGENT_ADDRESS } }
        );
        if (res.record) {
          records.push(res.record);
        }
      } catch {
        // user not enrolled
      }
    }

    return records;
  }
}
