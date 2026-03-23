use cosmwasm_std::{
    entry_point, to_json_binary, Binary, Deps, DepsMut, Env, MessageInfo, Response, StdResult,
};
use cw2::set_contract_version;

use crate::error::ContractError;
use crate::msg::{ExecuteMsg, InstantiateMsg, QueryMsg, EpochResponse, PhaseResponse};
use crate::state::{Config, Epoch, EpochPhase, CONFIG, CURRENT_EPOCH_ID, EPOCHS};

const CONTRACT_NAME: &str = "crates.io:epoch-controller";
const CONTRACT_VERSION: &str = env!("CARGO_PKG_VERSION");

#[entry_point]
pub fn instantiate(
    deps: DepsMut,
    env: Env,
    _info: MessageInfo,
    msg: InstantiateMsg,
) -> Result<Response, ContractError> {
    set_contract_version(deps.storage, CONTRACT_NAME, CONTRACT_VERSION)?;

    let admin = deps.api.addr_validate(&msg.admin)?;
    let bribe_vault = msg
        .bribe_vault
        .map(|a| deps.api.addr_validate(&a))
        .transpose()?;
    let vote_registry = msg
        .vote_registry
        .map(|a| deps.api.addr_validate(&a))
        .transpose()?;

    CONFIG.save(
        deps.storage,
        &Config {
            admin,
            bribe_vault,
            vote_registry,
            min_distribution_blocks: msg.min_distribution_blocks,
        },
    )?;

    // Epoch counter starts at 0; first CreateEpoch will set it to 1
    CURRENT_EPOCH_ID.save(deps.storage, &0u64)?;

    Ok(Response::new()
        .add_attribute("action", "instantiate")
        .add_attribute("contract", CONTRACT_NAME)
        .add_attribute("block_height", env.block.height.to_string()))
}

#[entry_point]
pub fn execute(
    deps: DepsMut,
    env: Env,
    info: MessageInfo,
    msg: ExecuteMsg,
) -> Result<Response, ContractError> {
    match msg {
        ExecuteMsg::CreateEpoch {} => execute_create_epoch(deps, env, info),
        ExecuteMsg::AdvanceToSnapshot {} => execute_advance_snapshot(deps, env, info),
        ExecuteMsg::AdvanceToDistribution {} => execute_advance_distribution(deps, env, info),
        ExecuteMsg::CloseEpoch {} => execute_close_epoch(deps, env, info),
        ExecuteMsg::UpdateConfig {
            bribe_vault,
            vote_registry,
            admin,
        } => execute_update_config(deps, info, bribe_vault, vote_registry, admin),
    }
}

fn only_admin(deps: Deps, info: &MessageInfo) -> Result<(), ContractError> {
    let cfg = CONFIG.load(deps.storage)?;
    if info.sender != cfg.admin {
        return Err(ContractError::Unauthorized {});
    }
    Ok(())
}

fn execute_create_epoch(
    deps: DepsMut,
    env: Env,
    info: MessageInfo,
) -> Result<Response, ContractError> {
    only_admin(deps.as_ref(), &info)?;
    let cfg = CONFIG.load(deps.storage)?;

    let new_id = CURRENT_EPOCH_ID.load(deps.storage)? + 1;
    let epoch = Epoch {
        id: new_id,
        phase: EpochPhase::Deposit,
        deposit_start: env.block.height,
        snapshot_height: None,
        distribution_start: None,
        closed_at: None,
        min_distribution_blocks: cfg.min_distribution_blocks,
    };

    EPOCHS.save(deps.storage, new_id, &epoch)?;
    CURRENT_EPOCH_ID.save(deps.storage, &new_id)?;

    Ok(Response::new()
        .add_attribute("action", "create_epoch")
        .add_attribute("epoch_id", new_id.to_string())
        .add_attribute("phase", "Deposit"))
}

fn execute_advance_snapshot(
    deps: DepsMut,
    env: Env,
    info: MessageInfo,
) -> Result<Response, ContractError> {
    only_admin(deps.as_ref(), &info)?;

    let epoch_id = CURRENT_EPOCH_ID.load(deps.storage)?;
    let mut epoch = EPOCHS
        .load(deps.storage, epoch_id)
        .map_err(|_| ContractError::EpochNotFound { epoch_id })?;

    if !matches!(epoch.phase, EpochPhase::Deposit) {
        return Err(ContractError::WrongPhase {
            epoch_id,
            expected: "Deposit".into(),
        });
    }

    epoch.phase = EpochPhase::Snapshot;
    epoch.snapshot_height = Some(env.block.height);
    EPOCHS.save(deps.storage, epoch_id, &epoch)?;

    Ok(Response::new()
        .add_attribute("action", "advance_to_snapshot")
        .add_attribute("epoch_id", epoch_id.to_string())
        .add_attribute("snapshot_height", env.block.height.to_string()))
}

fn execute_advance_distribution(
    deps: DepsMut,
    env: Env,
    info: MessageInfo,
) -> Result<Response, ContractError> {
    only_admin(deps.as_ref(), &info)?;

    let epoch_id = CURRENT_EPOCH_ID.load(deps.storage)?;
    let mut epoch = EPOCHS
        .load(deps.storage, epoch_id)
        .map_err(|_| ContractError::EpochNotFound { epoch_id })?;

    if !matches!(epoch.phase, EpochPhase::Snapshot) {
        return Err(ContractError::WrongPhase {
            epoch_id,
            expected: "Snapshot".into(),
        });
    }

    epoch.phase = EpochPhase::Distribution;
    epoch.distribution_start = Some(env.block.height);
    EPOCHS.save(deps.storage, epoch_id, &epoch)?;

    Ok(Response::new()
        .add_attribute("action", "advance_to_distribution")
        .add_attribute("epoch_id", epoch_id.to_string()))
}

fn execute_close_epoch(
    deps: DepsMut,
    env: Env,
    info: MessageInfo,
) -> Result<Response, ContractError> {
    only_admin(deps.as_ref(), &info)?;

    let epoch_id = CURRENT_EPOCH_ID.load(deps.storage)?;
    let mut epoch = EPOCHS
        .load(deps.storage, epoch_id)
        .map_err(|_| ContractError::EpochNotFound { epoch_id })?;

    if !matches!(epoch.phase, EpochPhase::Distribution) {
        return Err(ContractError::WrongPhase {
            epoch_id,
            expected: "Distribution".into(),
        });
    }

    let dist_start = epoch.distribution_start.unwrap();
    if env.block.height < dist_start + epoch.min_distribution_blocks {
        return Err(ContractError::DistributionWindowNotElapsed {});
    }

    epoch.phase = EpochPhase::Closed;
    epoch.closed_at = Some(env.block.height);
    EPOCHS.save(deps.storage, epoch_id, &epoch)?;

    Ok(Response::new()
        .add_attribute("action", "close_epoch")
        .add_attribute("epoch_id", epoch_id.to_string())
        .add_attribute("closed_at", env.block.height.to_string()))
}

fn execute_update_config(
    deps: DepsMut,
    info: MessageInfo,
    bribe_vault: Option<String>,
    vote_registry: Option<String>,
    new_admin: Option<String>,
) -> Result<Response, ContractError> {
    only_admin(deps.as_ref(), &info)?;
    let mut cfg = CONFIG.load(deps.storage)?;

    if let Some(addr) = bribe_vault {
        cfg.bribe_vault = Some(deps.api.addr_validate(&addr)?);
    }
    if let Some(addr) = vote_registry {
        cfg.vote_registry = Some(deps.api.addr_validate(&addr)?);
    }
    if let Some(addr) = new_admin {
        cfg.admin = deps.api.addr_validate(&addr)?;
    }

    CONFIG.save(deps.storage, &cfg)?;
    Ok(Response::new().add_attribute("action", "update_config"))
}

#[entry_point]
pub fn query(deps: Deps, _env: Env, msg: QueryMsg) -> StdResult<Binary> {
    match msg {
        QueryMsg::CurrentEpoch {} => {
            let epoch_id = CURRENT_EPOCH_ID.load(deps.storage)?;
            let epoch = EPOCHS.load(deps.storage, epoch_id)?;
            to_json_binary(&EpochResponse { epoch })
        }
        QueryMsg::Epoch { id } => {
            let epoch = EPOCHS.load(deps.storage, id)?;
            to_json_binary(&EpochResponse { epoch })
        }
        QueryMsg::CurrentPhase {} => {
            let epoch_id = CURRENT_EPOCH_ID.load(deps.storage)?;
            let epoch = EPOCHS.load(deps.storage, epoch_id)?;
            to_json_binary(&PhaseResponse {
                epoch_id,
                phase: epoch.phase,
            })
        }
    }
}
