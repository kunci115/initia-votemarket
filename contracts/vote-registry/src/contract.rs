use cosmwasm_std::{
    entry_point, to_json_binary, Binary, Deps, DepsMut, Env, MessageInfo, Response, StdResult,
    Uint128, WasmMsg, to_json_binary as to_binary,
};
use cw2::set_contract_version;

use crate::error::ContractError;
use crate::msg::{
    DelegationResponse, EpochWeightsResponse, ExecuteMsg, InstantiateMsg, QueryMsg,
    SessionKeyResponse, VipScoreResponse,
};
use crate::state::{
    Config, Delegation, SessionKeyRecord, VipSnapshot, CONFIG, DELEGATIONS, EPOCH_TOTAL_VOTES,
    PROTOCOL_VOTE_TOTALS, SESSION_KEYS, VIP_SNAPSHOTS,
};

const CONTRACT_NAME: &str = "crates.io:vote-registry";
const CONTRACT_VERSION: &str = env!("CARGO_PKG_VERSION");

#[entry_point]
pub fn instantiate(
    deps: DepsMut,
    _env: Env,
    _info: MessageInfo,
    msg: InstantiateMsg,
) -> Result<Response, ContractError> {
    set_contract_version(deps.storage, CONTRACT_NAME, CONTRACT_VERSION)?;

    CONFIG.save(
        deps.storage,
        &Config {
            admin: deps.api.addr_validate(&msg.admin)?,
            epoch_controller: deps.api.addr_validate(&msg.epoch_controller)?,
            bribe_vault: deps.api.addr_validate(&msg.bribe_vault)?,
            vip_query_path: msg.vip_query_path,
        },
    )?;

    Ok(Response::new().add_attribute("action", "instantiate"))
}

#[entry_point]
pub fn execute(
    deps: DepsMut,
    env: Env,
    info: MessageInfo,
    msg: ExecuteMsg,
) -> Result<Response, ContractError> {
    match msg {
        ExecuteMsg::DelegateVotes {
            epoch_id,
            protocol,
            on_behalf_of,
        } => execute_delegate_votes(deps, env, info, epoch_id, protocol, on_behalf_of),
        ExecuteMsg::RegisterSessionKey {
            agent,
            can_delegate,
            can_claim,
            max_weight_change_bps,
            allowed_protocols,
        } => execute_register_session_key(
            deps,
            env,
            info,
            agent,
            can_delegate,
            can_claim,
            max_weight_change_bps,
            allowed_protocols,
        ),
        ExecuteMsg::RevokeSessionKey { agent } => {
            execute_revoke_session_key(deps, info, agent)
        }
        ExecuteMsg::SnapshotVipScores {
            epoch_id,
            manual_scores,
        } => execute_snapshot_vip_scores(deps, env, info, epoch_id, manual_scores),
        ExecuteMsg::FinalizeEpoch { epoch_id } => execute_finalize_epoch(deps, info, epoch_id),
        ExecuteMsg::UpdateConfig { bribe_vault, admin } => {
            execute_update_config(deps, info, bribe_vault, admin)
        }
    }
}

fn execute_delegate_votes(
    deps: DepsMut,
    env: Env,
    info: MessageInfo,
    epoch_id: u64,
    protocol: String,
    on_behalf_of: Option<String>,
) -> Result<Response, ContractError> {
    let protocol_addr = deps.api.addr_validate(&protocol)?;

    let user = match on_behalf_of {
        Some(ref user_str) => {
            // Agent acting on behalf of user — verify session key
            let user_addr = deps.api.addr_validate(user_str)?;
            let record = SESSION_KEYS
                .may_load(deps.storage, (&user_addr, &info.sender))?
                .ok_or(ContractError::AgentNotAuthorized {
                    agent: info.sender.to_string(),
                    user: user_addr.to_string(),
                })?;

            if !record.can_delegate {
                return Err(ContractError::AgentPermissionDenied {
                    reason: "can_delegate is false".into(),
                });
            }

            // Check allowed_protocols list
            if !record.allowed_protocols.is_empty()
                && !record.allowed_protocols.contains(&protocol_addr)
            {
                return Err(ContractError::AgentPermissionDenied {
                    reason: "protocol not in allowed_protocols".into(),
                });
            }

            user_addr
        }
        None => info.sender.clone(),
    };

    // Placeholder weight = 1 unit until VIP snapshot runs
    // Final weight assigned during SnapshotVipScores
    let delegation = Delegation {
        epoch_id,
        user: user.clone(),
        protocol: protocol_addr.clone(),
        weight: Uint128::zero(), // filled at snapshot
    };

    DELEGATIONS.save(deps.storage, (epoch_id, &user), &delegation)?;

    Ok(Response::new()
        .add_attribute("action", "delegate_votes")
        .add_attribute("epoch_id", epoch_id.to_string())
        .add_attribute("user", user.to_string())
        .add_attribute("protocol", protocol_addr.to_string())
        .add_attribute("delegated_by", info.sender.to_string())
        .add_attribute("height", env.block.height.to_string()))
}

#[allow(clippy::too_many_arguments)]
fn execute_register_session_key(
    deps: DepsMut,
    env: Env,
    info: MessageInfo,
    agent: String,
    can_delegate: bool,
    can_claim: bool,
    max_weight_change_bps: u64,
    allowed_protocols: Vec<String>,
) -> Result<Response, ContractError> {
    // CRITICAL: register is ALWAYS by the user themselves
    // No on_behalf_of parameter — intentional by design
    let user = info.sender.clone();
    let agent_addr = deps.api.addr_validate(&agent)?;

    let allowed_protocol_addrs: Result<Vec<_>, _> = allowed_protocols
        .iter()
        .map(|p| deps.api.addr_validate(p))
        .collect();
    let allowed_protocol_addrs = allowed_protocol_addrs?;

    let record = SessionKeyRecord {
        user: user.clone(),
        agent: agent_addr.clone(),
        can_delegate,
        can_claim,
        max_weight_change_bps,
        allowed_protocols: allowed_protocol_addrs,
        registered_at_height: env.block.height,
    };

    SESSION_KEYS.save(deps.storage, (&user, &agent_addr), &record)?;

    Ok(Response::new()
        .add_attribute("action", "register_session_key")
        .add_attribute("user", user.to_string())
        .add_attribute("agent", agent_addr.to_string()))
}

fn execute_revoke_session_key(
    deps: DepsMut,
    info: MessageInfo,
    agent: String,
) -> Result<Response, ContractError> {
    // CRITICAL: revoke is ALWAYS by the user themselves
    let user = info.sender.clone();
    let agent_addr = deps.api.addr_validate(&agent)?;

    SESSION_KEYS
        .may_load(deps.storage, (&user, &agent_addr))?
        .ok_or(ContractError::SessionKeyNotFound {
            agent: agent_addr.to_string(),
        })?;

    SESSION_KEYS.remove(deps.storage, (&user, &agent_addr));

    Ok(Response::new()
        .add_attribute("action", "revoke_session_key")
        .add_attribute("user", user.to_string())
        .add_attribute("agent", agent_addr.to_string()))
}

fn execute_snapshot_vip_scores(
    deps: DepsMut,
    env: Env,
    info: MessageInfo,
    epoch_id: u64,
    manual_scores: Option<Vec<(String, Uint128)>>,
) -> Result<Response, ContractError> {
    let cfg = CONFIG.load(deps.storage)?;
    if info.sender != cfg.admin && info.sender != cfg.epoch_controller {
        return Err(ContractError::Unauthorized {});
    }

    // Collect all users who delegated in this epoch
    let delegations: Vec<_> = DELEGATIONS
        .prefix(epoch_id)
        .range(deps.storage, None, None, cosmwasm_std::Order::Ascending)
        .collect::<StdResult<Vec<_>>>()?;

    // Apply scores — use manual_scores if provided, else query each user's INIT balance.
    // VIP module (initia.vip.v1) is not yet live on testnet (v1.3.1).
    // INIT balance is a trustless on-chain proxy: more stake = more vote weight.
    // Replace with real VIP scores via manual_scores if Initia ships the module before demo.
    let denom = "uinit".to_string();
    let score_map: std::collections::HashMap<String, Uint128> = match manual_scores {
        Some(scores) => scores.into_iter().collect(),
        None => {
            let mut map = std::collections::HashMap::new();
            for (addr, _) in &delegations {
                let balance = deps
                    .querier
                    .query_balance(addr.clone(), denom.clone())
                    .unwrap_or(cosmwasm_std::Coin {
                        denom: denom.clone(),
                        amount: Uint128::one(),
                    });
                // Floor at 1 so zero-balance users still get a minimal weight
                let weight = if balance.amount.is_zero() {
                    Uint128::one()
                } else {
                    balance.amount
                };
                map.insert(addr.to_string(), weight);
            }
            map
        }
    };

    for (user_addr, mut delegation) in delegations {
        let score = score_map
            .get(&user_addr.to_string())
            .copied()
            .unwrap_or(Uint128::one());

        // Update delegation weight
        delegation.weight = score;
        DELEGATIONS.save(deps.storage, (epoch_id, &user_addr), &delegation)?;

        // Save snapshot record
        VIP_SNAPSHOTS.save(
            deps.storage,
            (epoch_id, &user_addr),
            &VipSnapshot {
                user: user_addr.clone(),
                epoch_id,
                score,
                snapshot_height: env.block.height,
            },
        )?;

        // Accumulate per-protocol totals
        let current = PROTOCOL_VOTE_TOTALS
            .may_load(deps.storage, (epoch_id, &delegation.protocol))?
            .unwrap_or(Uint128::zero());
        PROTOCOL_VOTE_TOTALS.save(
            deps.storage,
            (epoch_id, &delegation.protocol),
            &(current + score),
        )?;

        // Accumulate epoch total
        let total = EPOCH_TOTAL_VOTES
            .may_load(deps.storage, epoch_id)?
            .unwrap_or(Uint128::zero());
        EPOCH_TOTAL_VOTES.save(deps.storage, epoch_id, &(total + score))?;
    }

    Ok(Response::new()
        .add_attribute("action", "snapshot_vip_scores")
        .add_attribute("epoch_id", epoch_id.to_string()))
}

fn execute_finalize_epoch(
    deps: DepsMut,
    info: MessageInfo,
    epoch_id: u64,
) -> Result<Response, ContractError> {
    let cfg = CONFIG.load(deps.storage)?;
    if info.sender != cfg.admin && info.sender != cfg.epoch_controller {
        return Err(ContractError::Unauthorized {});
    }

    // Collect all protocol vote totals for this epoch
    let weights: Vec<(String, Uint128)> = PROTOCOL_VOTE_TOTALS
        .prefix(epoch_id)
        .range(deps.storage, None, None, cosmwasm_std::Order::Ascending)
        .map(|r| r.map(|(addr, weight)| (addr.to_string(), weight)))
        .collect::<StdResult<Vec<_>>>()?;

    let total = EPOCH_TOTAL_VOTES
        .may_load(deps.storage, epoch_id)?
        .unwrap_or(Uint128::zero());

    // Push vote weights to BribeVault
    let record_msg = WasmMsg::Execute {
        contract_addr: cfg.bribe_vault.to_string(),
        msg: to_binary(&bribe_vault_msg::ExecuteMsg::RecordVoteWeights {
            epoch_id,
            weights: weights.clone(),
            total,
        })?,
        funds: vec![],
    };

    Ok(Response::new()
        .add_message(record_msg)
        .add_attribute("action", "finalize_epoch")
        .add_attribute("epoch_id", epoch_id.to_string())
        .add_attribute("total_votes", total.to_string()))
}

fn execute_update_config(
    deps: DepsMut,
    info: MessageInfo,
    bribe_vault: Option<String>,
    new_admin: Option<String>,
) -> Result<Response, ContractError> {
    let mut cfg = CONFIG.load(deps.storage)?;
    if info.sender != cfg.admin {
        return Err(ContractError::Unauthorized {});
    }
    if let Some(addr) = bribe_vault {
        cfg.bribe_vault = deps.api.addr_validate(&addr)?;
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
        QueryMsg::UserDelegation { epoch_id, user } => {
            let addr = deps.api.addr_validate(&user)?;
            let delegation = DELEGATIONS.may_load(deps.storage, (epoch_id, &addr))?;
            to_json_binary(&DelegationResponse { delegation })
        }
        QueryMsg::SessionKey { user, agent } => {
            let user_addr = deps.api.addr_validate(&user)?;
            let agent_addr = deps.api.addr_validate(&agent)?;
            let record = SESSION_KEYS.may_load(deps.storage, (&user_addr, &agent_addr))?;
            to_json_binary(&SessionKeyResponse { record })
        }
        QueryMsg::VipScore { epoch_id, user } => {
            let addr = deps.api.addr_validate(&user)?;
            let snapshot = VIP_SNAPSHOTS.may_load(deps.storage, (epoch_id, &addr))?;
            to_json_binary(&VipScoreResponse { snapshot })
        }
        QueryMsg::EpochWeights { epoch_id } => {
            let weights: Vec<(String, Uint128)> = PROTOCOL_VOTE_TOTALS
                .prefix(epoch_id)
                .range(deps.storage, None, None, cosmwasm_std::Order::Ascending)
                .map(|r| r.map(|(addr, w)| (addr.to_string(), w)))
                .collect::<StdResult<Vec<_>>>()?;
            let total = EPOCH_TOTAL_VOTES
                .may_load(deps.storage, epoch_id)?
                .unwrap_or(Uint128::zero());
            to_json_binary(&EpochWeightsResponse { weights, total })
        }
    }
}

/// Inline message type for cross-contract call to BribeVault
mod bribe_vault_msg {
    use cosmwasm_schema::cw_serde;
    use cosmwasm_std::Uint128;

    #[cw_serde]
    pub enum ExecuteMsg {
        RecordVoteWeights {
            epoch_id: u64,
            weights: Vec<(String, Uint128)>,
            total: Uint128,
        },
    }
}
