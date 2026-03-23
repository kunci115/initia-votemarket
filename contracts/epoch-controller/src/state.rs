use cosmwasm_schema::cw_serde;
use cosmwasm_std::Addr;
use cw_storage_plus::{Item, Map};

#[cw_serde]
pub enum EpochPhase {
    Deposit,
    Snapshot,
    Distribution,
    Closed,
}

impl std::fmt::Display for EpochPhase {
    fn fmt(&self, f: &mut std::fmt::Formatter) -> std::fmt::Result {
        match self {
            EpochPhase::Deposit => write!(f, "Deposit"),
            EpochPhase::Snapshot => write!(f, "Snapshot"),
            EpochPhase::Distribution => write!(f, "Distribution"),
            EpochPhase::Closed => write!(f, "Closed"),
        }
    }
}

#[cw_serde]
pub struct Epoch {
    pub id: u64,
    pub phase: EpochPhase,
    pub deposit_start: u64,   // block height
    pub snapshot_height: Option<u64>,
    pub distribution_start: Option<u64>,
    pub closed_at: Option<u64>,
    pub min_distribution_blocks: u64,
}

#[cw_serde]
pub struct Config {
    pub admin: Addr,
    pub bribe_vault: Option<Addr>,
    pub vote_registry: Option<Addr>,
    pub min_distribution_blocks: u64,
}

pub const CONFIG: Item<Config> = Item::new("config");
pub const CURRENT_EPOCH_ID: Item<u64> = Item::new("current_epoch_id");
pub const EPOCHS: Map<u64, Epoch> = Map::new("epochs");
