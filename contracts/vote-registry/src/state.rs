use cosmwasm_schema::cw_serde;
use cosmwasm_std::{Addr, Uint128};
use cw_storage_plus::{Item, Map};

#[cw_serde]
pub struct Config {
    pub admin: Addr,
    pub epoch_controller: Addr,
    pub bribe_vault: Addr,
    /// Optional: Stargate query path for VIP scores
    pub vip_query_path: String,
}

/// Session key permissions for AI agent
#[cw_serde]
pub struct SessionKeyRecord {
    pub user: Addr,
    pub agent: Addr,
    pub can_delegate: bool,
    pub can_claim: bool,
    /// Max basis points of vote weight the agent can redirect per call
    pub max_weight_change_bps: u64,
    /// Allowlisted protocol addresses the agent may delegate to (empty = any)
    pub allowed_protocols: Vec<Addr>,
    pub registered_at_height: u64,
}

/// Delegation: user → protocol for a given epoch
#[cw_serde]
pub struct Delegation {
    pub epoch_id: u64,
    pub user: Addr,
    pub protocol: Addr,
    /// Vote weight (derived from VIP score at snapshot)
    pub weight: Uint128,
}

/// Snapshotted VIP score per user per epoch
#[cw_serde]
pub struct VipSnapshot {
    pub user: Addr,
    pub epoch_id: u64,
    pub score: Uint128,
    pub snapshot_height: u64,
}

pub const CONFIG: Item<Config> = Item::new("config");

/// Key: (epoch_id, user_addr) → Delegation
pub const DELEGATIONS: Map<(u64, &Addr), Delegation> = Map::new("delegations");

/// Key: (epoch_id, user_addr) → VipSnapshot
pub const VIP_SNAPSHOTS: Map<(u64, &Addr), VipSnapshot> = Map::new("vip_snapshots");

/// Key: (user_addr, agent_addr) → SessionKeyRecord
pub const SESSION_KEYS: Map<(&Addr, &Addr), SessionKeyRecord> = Map::new("session_keys");

/// Epoch total vote weight per protocol — used to push to BribeVault
/// Key: (epoch_id, protocol_addr) → total weight
pub const PROTOCOL_VOTE_TOTALS: Map<(u64, &Addr), Uint128> = Map::new("protocol_vote_totals");

/// Total votes per epoch
pub const EPOCH_TOTAL_VOTES: Map<u64, Uint128> = Map::new("epoch_total_votes");
