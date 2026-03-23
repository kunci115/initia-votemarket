use cosmwasm_std::StdError;
use thiserror::Error;

#[derive(Error, Debug)]
pub enum ContractError {
    #[error("{0}")]
    Std(#[from] StdError),

    #[error("Unauthorized")]
    Unauthorized {},

    #[error("Epoch {epoch_id} is not in Deposit phase")]
    NotDepositPhase { epoch_id: u64 },

    #[error("Epoch {epoch_id} is not in Distribution phase")]
    NotDistributionPhase { epoch_id: u64 },

    #[error("Epoch {epoch_id} is already Closed")]
    EpochClosed { epoch_id: u64 },

    #[error("No bribe found for protocol {protocol} in epoch {epoch_id}")]
    BribeNotFound { epoch_id: u64, protocol: String },

    #[error("Rewards already claimed for user {user} in epoch {epoch_id}")]
    AlreadyClaimed { epoch_id: u64, user: String },

    #[error("No rewards to claim")]
    NoRewards {},

    #[error("Must send exactly one coin for bribe deposit")]
    InvalidFunds {},

    #[error("Bribe deposits can only be increased, not decreased")]
    CannotDecreaseBribe {},
}
