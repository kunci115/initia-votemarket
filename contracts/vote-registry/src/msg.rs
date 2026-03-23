use cosmwasm_schema::{cw_serde, QueryResponses};
use cosmwasm_std::Uint128;
use crate::state::{Delegation, SessionKeyRecord, VipSnapshot};

#[cw_serde]
pub struct InstantiateMsg {
    pub admin: String,
    pub epoch_controller: String,
    pub bribe_vault: String,
    pub vip_query_path: String,
}

#[cw_serde]
pub enum ExecuteMsg {
    /// User delegates their VIP votes to a protocol for an epoch.
    /// Can also be called by AI agent via session key (on_behalf_of).
    DelegateVotes {
        epoch_id: u64,
        protocol: String,
        on_behalf_of: Option<String>,
    },

    /// User registers an AI agent session key.
    /// ONLY callable by the user themselves — never on_behalf_of.
    RegisterSessionKey {
        agent: String,
        can_delegate: bool,
        can_claim: bool,
        max_weight_change_bps: u64,
        allowed_protocols: Vec<String>,
    },

    /// User revokes a session key immediately.
    /// ONLY callable by the user themselves — never on_behalf_of.
    RevokeSessionKey { agent: String },

    /// Admin/epoch_controller: snapshot VIP scores for all delegated users in an epoch.
    /// Calls Stargate query /initia.vip.v1.Query/VipScore for each user.
    SnapshotVipScores {
        epoch_id: u64,
        /// Optional manual fallback if VIP module not available
        manual_scores: Option<Vec<(String, Uint128)>>,
    },

    /// After snapshot, finalize vote weights and push to BribeVault.
    FinalizeEpoch { epoch_id: u64 },

    /// Admin config update
    UpdateConfig {
        bribe_vault: Option<String>,
        admin: Option<String>,
    },
}

#[cw_serde]
#[derive(QueryResponses)]
pub enum QueryMsg {
    #[returns(DelegationResponse)]
    UserDelegation { epoch_id: u64, user: String },

    #[returns(SessionKeyResponse)]
    SessionKey { user: String, agent: String },

    #[returns(VipScoreResponse)]
    VipScore { epoch_id: u64, user: String },

    #[returns(EpochWeightsResponse)]
    EpochWeights { epoch_id: u64 },
}

#[cw_serde]
pub struct DelegationResponse {
    pub delegation: Option<Delegation>,
}

#[cw_serde]
pub struct SessionKeyResponse {
    pub record: Option<SessionKeyRecord>,
}

#[cw_serde]
pub struct VipScoreResponse {
    pub snapshot: Option<VipSnapshot>,
}

#[cw_serde]
pub struct EpochWeightsResponse {
    pub weights: Vec<(String, Uint128)>,
    pub total: Uint128,
}
