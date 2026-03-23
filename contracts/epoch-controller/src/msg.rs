use cosmwasm_schema::{cw_serde, QueryResponses};
use crate::state::{Epoch, EpochPhase};

#[cw_serde]
pub struct InstantiateMsg {
    pub admin: String,
    pub bribe_vault: Option<String>,
    pub vote_registry: Option<String>,
    /// Minimum number of blocks the distribution phase must be open
    pub min_distribution_blocks: u64,
}

#[cw_serde]
pub enum ExecuteMsg {
    /// Admin: open a new epoch (moves to Deposit phase)
    CreateEpoch {},
    /// Admin: advance current epoch to Snapshot phase
    AdvanceToSnapshot {},
    /// Admin: advance current epoch to Distribution phase (triggers VIP score snapshot)
    AdvanceToDistribution {},
    /// Admin: close current epoch (enforces min_distribution_blocks)
    CloseEpoch {},
    /// Admin: update contract addresses post-deploy
    UpdateConfig {
        bribe_vault: Option<String>,
        vote_registry: Option<String>,
        admin: Option<String>,
    },
}

#[cw_serde]
#[derive(QueryResponses)]
pub enum QueryMsg {
    #[returns(EpochResponse)]
    CurrentEpoch {},
    #[returns(EpochResponse)]
    Epoch { id: u64 },
    #[returns(PhaseResponse)]
    CurrentPhase {},
}

#[cw_serde]
pub struct EpochResponse {
    pub epoch: Epoch,
}

#[cw_serde]
pub struct PhaseResponse {
    pub epoch_id: u64,
    pub phase: EpochPhase,
}
