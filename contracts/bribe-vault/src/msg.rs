use cosmwasm_schema::{cw_serde, QueryResponses};
use cosmwasm_std::Uint128;
pub use crate::state::BribeOffer;

#[cw_serde]
pub struct InstantiateMsg {
    pub admin: String,
    pub epoch_controller: String,
    pub vote_registry: String,
    pub treasury: String,
    /// Fee in basis points (400 = 4%)
    pub fee_bps: u64,
    /// Native denom for bribes (e.g. "uinit")
    pub denom: String,
}

#[cw_serde]
pub enum ExecuteMsg {
    /// Protocol deposits a bribe for a specific epoch.
    /// Must send funds matching config.denom.
    DepositBribe { epoch_id: u64 },

    /// Protocol increases their existing bribe for an epoch.
    IncreaseBribe { epoch_id: u64 },

    /// Called by vote-registry to record final vote weights.
    /// Only callable by vote_registry address.
    RecordVoteWeights {
        epoch_id: u64,
        weights: Vec<(String, Uint128)>, // (protocol_addr, weight)
        total: Uint128,
    },

    /// User (or AI agent on_behalf_of user) claims their share of bribes.
    /// Beneficiary always receives funds, not the caller.
    ClaimRewards {
        epoch_id: u64,
        on_behalf_of: Option<String>,
    },

    /// Admin: update mutable config fields after deployment.
    UpdateConfig {
        vote_registry: Option<String>,
        treasury: Option<String>,
        admin: Option<String>,
    },
}

#[cw_serde]
#[derive(QueryResponses)]
pub enum QueryMsg {
    #[returns(BribeOffersResponse)]
    BribeOffers { epoch_id: u64 },

    #[returns(BribeOffer)]
    BribeOffer { epoch_id: u64, protocol: String },

    #[returns(UserRewardResponse)]
    UserReward { epoch_id: u64, user: String },

    #[returns(ClaimedResponse)]
    Claimed { epoch_id: u64, user: String },
}

#[cw_serde]
pub struct BribeOffersResponse {
    pub offers: Vec<BribeOffer>,
}

#[cw_serde]
pub struct UserRewardResponse {
    pub amount: Uint128,
    pub claimed: bool,
}

#[cw_serde]
pub struct ClaimedResponse {
    pub claimed: bool,
}
