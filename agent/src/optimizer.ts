import { AgentWallet } from "./wallet";
import { BribeOffer, ContractClient, EpochState } from "./contracts";
import { logger } from "./logger";

interface ScoredOffer {
  offer: BribeOffer;
  score: number;
  rationale: string;
}

export class EpochOptimizer {
  private processedClaims = new Set<string>(); // "epochId:userAddr"
  private processedDelegations = new Set<string>(); // "epochId:userAddr"

  constructor(
    private readonly wallet: AgentWallet,
    private readonly contracts: ContractClient
  ) {}

  async tick(): Promise<void> {
    const epoch = await this.contracts.getCurrentEpoch();
    logger.info(`Epoch #${epoch.id} — Phase: ${epoch.phase}`);

    switch (epoch.phase) {
      case "Distribution":
        await this.handleDistributionPhase(epoch);
        break;
      case "Closed":
        await this.handleClaimsForPreviousEpoch(epoch.id);
        break;
      default:
        logger.info(`Phase ${epoch.phase}: nothing to do`);
    }
  }

  /**
   * Distribution phase: score all bribe offers and delegate votes for
   * each enrolled user who hasn't delegated yet.
   */
  private async handleDistributionPhase(epoch: EpochState): Promise<void> {
    const offers = await this.contracts.getBribeOffers(epoch.id);

    if (offers.length === 0) {
      logger.info("No bribe offers found for this epoch.");
      return;
    }

    const ranked = this.scoreOffers(offers);
    const bestOffer = ranked[0];

    logger.info(
      `Best offer: ${bestOffer.offer.protocol} | Score: ${bestOffer.score.toFixed(2)} | Reason: ${bestOffer.rationale}`
    );

    const enrolledUsers = await this.contracts.getEnrolledUsers();
    logger.info(`Processing ${enrolledUsers.length} enrolled users...`);

    for (const user of enrolledUsers) {
      if (!user.can_delegate) continue;

      const key = `${epoch.id}:${user.user}`;
      if (this.processedDelegations.has(key)) continue;

      // Check if user already delegated
      const existing = await this.contracts.getUserDelegation(epoch.id, user.user);
      if (existing.delegation) {
        this.processedDelegations.add(key);
        continue;
      }

      // Pick best allowed offer for this user
      const targetOffer = this.pickBestForUser(ranked, user.allowed_protocols);
      if (!targetOffer) {
        logger.warn(`No valid offer found for user ${user.user}`);
        continue;
      }

      try {
        const txHash = await this.wallet.executeOnBehalfOf(
          process.env.VOTE_REGISTRY_ADDRESS!,
          {
            delegate_votes: {
              epoch_id: epoch.id,
              protocol: targetOffer.offer.protocol,
              on_behalf_of: user.user,
            },
          },
          user.user
        );

        this.processedDelegations.add(key);
        logger.info(
          `Delegated for ${user.user} → ${targetOffer.offer.protocol} | tx: ${txHash}`
        );
      } catch (err) {
        logger.error(`Delegation failed for ${user.user}:`, err);
      }
    }
  }

  /**
   * Closed phase: claim rewards for all enrolled users who haven't claimed.
   */
  private async handleClaimsForPreviousEpoch(epochId: number): Promise<void> {
    const enrolledUsers = await this.contracts.getEnrolledUsers();

    for (const user of enrolledUsers) {
      if (!user.can_claim) continue;

      const key = `${epochId}:${user.user}`;
      if (this.processedClaims.has(key)) continue;

      const reward = await this.contracts.getUserReward(epochId, user.user);
      if (reward.claimed || reward.amount === "0") {
        this.processedClaims.add(key);
        continue;
      }

      try {
        const txHash = await this.wallet.executeOnBehalfOf(
          process.env.BRIBE_VAULT_ADDRESS!,
          {
            claim_rewards: {
              epoch_id: epochId,
              on_behalf_of: user.user,
            },
          },
          user.user
        );

        this.processedClaims.add(key);
        logger.info(
          `Claimed ${reward.amount} uinit for ${user.user} | tx: ${txHash}`
        );
      } catch (err) {
        logger.error(`Claim failed for ${user.user}:`, err);
      }
    }
  }

  /**
   * Core AI scoring function.
   *
   * Scoring factors:
   * 1. yield_per_unit  — bribe amount (proxy for yield if we assume uniform vote dist)
   * 2. deposit_recency — newer deposits signal active protocol commitment
   * 3. reliability     — TODO: extend with historical payout success rate
   *
   * Higher = better. Returns offers sorted descending.
   */
  private scoreOffers(offers: BribeOffer[]): ScoredOffer[] {
    const maxAmount = Math.max(...offers.map((o) => Number(o.total_amount)));
    const maxHeight = Math.max(...offers.map((o) => o.deposited_at_height));

    return offers
      .map((offer) => {
        const amount = Number(offer.total_amount);

        // Factor 1: normalized bribe amount (0–1)
        const amountScore = maxAmount > 0 ? amount / maxAmount : 0;

        // Factor 2: deposit recency (0–1) — newer deposit = more committed
        const heightScore =
          maxHeight > 0 ? offer.deposited_at_height / maxHeight : 0;

        // Weighted sum — yield is primary signal
        const score = amountScore * 0.8 + heightScore * 0.2;

        const rationale = `amount=${(amount / 1_000_000).toFixed(2)}INIT recency=${heightScore.toFixed(2)}`;

        return { offer, score, rationale };
      })
      .sort((a, b) => b.score - a.score);
  }

  private pickBestForUser(
    ranked: ScoredOffer[],
    allowedProtocols: string[]
  ): ScoredOffer | null {
    if (allowedProtocols.length === 0) {
      return ranked[0] ?? null;
    }
    return (
      ranked.find((r) => allowedProtocols.includes(r.offer.protocol)) ?? null
    );
  }
}
