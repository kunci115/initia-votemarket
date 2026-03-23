use cosmwasm_schema::cw_serde;
use cosmwasm_std::{Addr, Uint128};
use cw_storage_plus::{Item, Map};

#[cw_serde]
pub struct Config {
    pub admin: Addr,
    pub epoch_controller: Addr,
    pub vote_registry: Addr,
    pub treasury: Addr,
    /// Fee in basis points (400 = 4%)
    pub fee_bps: u64,
    pub denom: String,
}

#[cw_serde]
pub struct BribeOffer {
    pub epoch_id: u64,
    pub protocol: Addr,
    pub total_amount: Uint128,
    pub deposited_at_height: u64,
}

/// Key: (epoch_id, protocol_addr)
pub const BRIBES: Map<(u64, &Addr), BribeOffer> = Map::new("bribes");

/// Key: (epoch_id, user_addr) → true if claimed
pub const CLAIMS: Map<(u64, &Addr), bool> = Map::new("claims");

/// Total votes recorded per epoch (set by vote-registry via callback)
/// Key: (epoch_id, protocol_addr) → vote weight
pub const VOTE_WEIGHTS: Map<(u64, &Addr), Uint128> = Map::new("vote_weights");

/// Total vote weight for epoch
pub const EPOCH_TOTAL_VOTES: Map<u64, Uint128> = Map::new("epoch_total_votes");

pub const CONFIG: Item<Config> = Item::new("config");
