use cosmwasm_std::StdError;
use thiserror::Error;

#[derive(Error, Debug)]
pub enum ContractError {
    #[error("{0}")]
    Std(#[from] StdError),

    #[error("Unauthorized")]
    Unauthorized {},

    #[error("Invalid phase transition: cannot move from {from} to {to}")]
    InvalidPhaseTransition { from: String, to: String },

    #[error("Epoch {epoch_id} not found")]
    EpochNotFound { epoch_id: u64 },

    #[error("Epoch {epoch_id} is not in the expected phase: {expected}")]
    WrongPhase { epoch_id: u64, expected: String },

    #[error("Minimum distribution window not yet elapsed")]
    DistributionWindowNotElapsed {},

    #[error("Contract address not set: {name}")]
    ContractNotSet { name: String },
}
