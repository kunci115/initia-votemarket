use cosmwasm_std::StdError;
use thiserror::Error;

#[derive(Error, Debug)]
pub enum ContractError {
    #[error("{0}")]
    Std(#[from] StdError),

    #[error("Unauthorized")]
    Unauthorized {},

    #[error("Epoch {epoch_id} is not in Distribution phase — cannot delegate")]
    NotDistributionPhase { epoch_id: u64 },

    #[error("Epoch {epoch_id} is not in Snapshot phase")]
    NotSnapshotPhase { epoch_id: u64 },

    #[error("Session key already registered for agent {agent}")]
    SessionKeyAlreadyExists { agent: String },

    #[error("No session key found for agent {agent}")]
    SessionKeyNotFound { agent: String },

    #[error("Agent {agent} is not authorized for user {user}")]
    AgentNotAuthorized { agent: String, user: String },

    #[error("Agent permission denied: {reason}")]
    AgentPermissionDenied { reason: String },

    #[error("Delegation already exists for user in epoch {epoch_id}")]
    AlreadyDelegated { epoch_id: u64 },

    #[error("Invalid vote weight — cannot exceed max_weight_change_bps")]
    ExceedsWeightLimit {},
}
