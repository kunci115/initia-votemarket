use cosmwasm_std::{
    entry_point, to_json_binary, BankMsg, Binary, Coin, CosmosMsg, Deps, DepsMut, Env,
    MessageInfo, Response, StdResult, Uint128,
};
use cw2::set_contract_version;

use crate::error::ContractError;
use crate::msg::{
    BribeOffer, BribeOffersResponse, ClaimedResponse, ExecuteMsg, InstantiateMsg, QueryMsg,
    UserRewardResponse,
};
use crate::state::{
    BribeOffer as StoredBribeOffer, BRIBES, CLAIMS, CONFIG, EPOCH_TOTAL_VOTES, VOTE_WEIGHTS,
    Config,
};

const CONTRACT_NAME: &str = "crates.io:bribe-vault";
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
            vote_registry: deps.api.addr_validate(&msg.vote_registry)?,
            treasury: deps.api.addr_validate(&msg.treasury)?,
            fee_bps: msg.fee_bps,
            denom: msg.denom,
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
        ExecuteMsg::DepositBribe { epoch_id } => execute_deposit_bribe(deps, env, info, epoch_id),
        ExecuteMsg::IncreaseBribe { epoch_id } => execute_increase_bribe(deps, env, info, epoch_id),
        ExecuteMsg::RecordVoteWeights {
            epoch_id,
            weights,
            total,
        } => execute_record_vote_weights(deps, info, epoch_id, weights, total),
        ExecuteMsg::ClaimRewards {
            epoch_id,
            on_behalf_of,
        } => execute_claim_rewards(deps, env, info, epoch_id, on_behalf_of),
        ExecuteMsg::UpdateConfig {
            vote_registry,
            treasury,
            admin,
        } => execute_update_config(deps, info, vote_registry, treasury, admin),
    }
}

fn execute_deposit_bribe(
    deps: DepsMut,
    env: Env,
    info: MessageInfo,
    epoch_id: u64,
) -> Result<Response, ContractError> {
    let cfg = CONFIG.load(deps.storage)?;

    let amount = get_sent_amount(&info, &cfg.denom)?;
    let protocol = info.sender.clone();

    // Disallow overwriting existing bribe — use IncreaseBribe
    if BRIBES.may_load(deps.storage, (epoch_id, &protocol))?.is_some() {
        return Err(ContractError::CannotDecreaseBribe {});
    }

    BRIBES.save(
        deps.storage,
        (epoch_id, &protocol),
        &StoredBribeOffer {
            epoch_id,
            protocol: protocol.clone(),
            total_amount: amount,
            deposited_at_height: env.block.height,
        },
    )?;

    Ok(Response::new()
        .add_attribute("action", "deposit_bribe")
        .add_attribute("epoch_id", epoch_id.to_string())
        .add_attribute("protocol", protocol.to_string())
        .add_attribute("amount", amount.to_string()))
}

fn execute_increase_bribe(
    deps: DepsMut,
    _env: Env,
    info: MessageInfo,
    epoch_id: u64,
) -> Result<Response, ContractError> {
    let cfg = CONFIG.load(deps.storage)?;
    let amount = get_sent_amount(&info, &cfg.denom)?;
    let protocol = info.sender.clone();

    let mut offer = BRIBES
        .load(deps.storage, (epoch_id, &protocol))
        .map_err(|_| ContractError::BribeNotFound {
            epoch_id,
            protocol: protocol.to_string(),
        })?;

    offer.total_amount += amount;
    BRIBES.save(deps.storage, (epoch_id, &protocol), &offer)?;

    Ok(Response::new()
        .add_attribute("action", "increase_bribe")
        .add_attribute("new_total", offer.total_amount.to_string()))
}

fn execute_record_vote_weights(
    deps: DepsMut,
    info: MessageInfo,
    epoch_id: u64,
    weights: Vec<(String, Uint128)>,
    total: Uint128,
) -> Result<Response, ContractError> {
    let cfg = CONFIG.load(deps.storage)?;
    if info.sender != cfg.vote_registry {
        return Err(ContractError::Unauthorized {});
    }

    for (protocol_str, weight) in &weights {
        let protocol = deps.api.addr_validate(protocol_str)?;
        VOTE_WEIGHTS.save(deps.storage, (epoch_id, &protocol), weight)?;
    }
    EPOCH_TOTAL_VOTES.save(deps.storage, epoch_id, &total)?;

    Ok(Response::new()
        .add_attribute("action", "record_vote_weights")
        .add_attribute("epoch_id", epoch_id.to_string())
        .add_attribute("total_votes", total.to_string()))
}

fn execute_claim_rewards(
    deps: DepsMut,
    _env: Env,
    info: MessageInfo,
    epoch_id: u64,
    on_behalf_of: Option<String>,
) -> Result<Response, ContractError> {
    let cfg = CONFIG.load(deps.storage)?;

    // Beneficiary is the user whose votes are being claimed for
    // Agent calls with on_behalf_of=user; funds go to user, never to agent
    let beneficiary = match on_behalf_of {
        Some(addr) => deps.api.addr_validate(&addr)?,
        None => info.sender.clone(),
    };

    // CHECKS: not already claimed
    if CLAIMS
        .may_load(deps.storage, (epoch_id, &beneficiary))?
        .unwrap_or(false)
    {
        return Err(ContractError::AlreadyClaimed {
            epoch_id,
            user: beneficiary.to_string(),
        });
    }

    let total_votes = EPOCH_TOTAL_VOTES
        .may_load(deps.storage, epoch_id)?
        .unwrap_or(Uint128::zero());

    if total_votes.is_zero() {
        return Err(ContractError::NoRewards {});
    }

    // Calculate user's share: sum across all protocols where user voted
    // For simplicity: user receives proportional share of all bribes based on their vote weight
    // Full implementation: iterate VOTE_WEIGHTS keyed per (epoch, user) from vote-registry
    // Here we read from a user-vote-weight key set by vote-registry
    let user_vote_weight = VOTE_WEIGHTS
        .may_load(deps.storage, (epoch_id, &beneficiary))?
        .unwrap_or(Uint128::zero());

    if user_vote_weight.is_zero() {
        return Err(ContractError::NoRewards {});
    }

    // Sum all bribe amounts for this epoch
    let total_bribes: Uint128 = BRIBES
        .prefix(epoch_id)
        .range(deps.storage, None, None, cosmwasm_std::Order::Ascending)
        .map(|r| r.map(|(_, offer)| offer.total_amount))
        .collect::<StdResult<Vec<_>>>()?
        .into_iter()
        .sum();

    // User's gross reward = total_bribes * user_weight / total_votes
    let gross = total_bribes
        .multiply_ratio(user_vote_weight, total_votes);

    // 4% fee to treasury
    let fee = gross.multiply_ratio(cfg.fee_bps, 10_000u64);
    let net = gross - fee;

    if net.is_zero() {
        return Err(ContractError::NoRewards {});
    }

    // EFFECTS: mark claimed BEFORE transfers
    CLAIMS.save(deps.storage, (epoch_id, &beneficiary), &true)?;

    // INTERACTIONS: send net to beneficiary, fee to treasury
    let mut msgs: Vec<CosmosMsg> = vec![CosmosMsg::Bank(BankMsg::Send {
        to_address: beneficiary.to_string(),
        amount: vec![Coin {
            denom: cfg.denom.clone(),
            amount: net,
        }],
    })];

    if !fee.is_zero() {
        msgs.push(CosmosMsg::Bank(BankMsg::Send {
            to_address: cfg.treasury.to_string(),
            amount: vec![Coin {
                denom: cfg.denom,
                amount: fee,
            }],
        }));
    }

    Ok(Response::new()
        .add_messages(msgs)
        .add_attribute("action", "claim_rewards")
        .add_attribute("epoch_id", epoch_id.to_string())
        .add_attribute("beneficiary", beneficiary.to_string())
        .add_attribute("net_amount", net.to_string())
        .add_attribute("fee", fee.to_string()))
}

fn execute_update_config(
    deps: DepsMut,
    info: MessageInfo,
    vote_registry: Option<String>,
    treasury: Option<String>,
    admin: Option<String>,
) -> Result<Response, ContractError> {
    let mut cfg = CONFIG.load(deps.storage)?;
    if info.sender != cfg.admin {
        return Err(ContractError::Unauthorized {});
    }
    if let Some(vr) = vote_registry {
        cfg.vote_registry = deps.api.addr_validate(&vr)?;
    }
    if let Some(t) = treasury {
        cfg.treasury = deps.api.addr_validate(&t)?;
    }
    if let Some(a) = admin {
        cfg.admin = deps.api.addr_validate(&a)?;
    }
    CONFIG.save(deps.storage, &cfg)?;
    Ok(Response::new().add_attribute("action", "update_config"))
}

fn get_sent_amount(info: &MessageInfo, denom: &str) -> Result<Uint128, ContractError> {
    if info.funds.len() != 1 || info.funds[0].denom != denom {
        return Err(ContractError::InvalidFunds {});
    }
    Ok(info.funds[0].amount)
}

#[entry_point]
pub fn query(deps: Deps, _env: Env, msg: QueryMsg) -> StdResult<Binary> {
    match msg {
        QueryMsg::BribeOffers { epoch_id } => {
            let offers: Vec<BribeOffer> = BRIBES
                .prefix(epoch_id)
                .range(deps.storage, None, None, cosmwasm_std::Order::Ascending)
                .map(|r| {
                    r.map(|(_, o)| BribeOffer {
                        epoch_id: o.epoch_id,
                        protocol: o.protocol,
                        total_amount: o.total_amount,
                        deposited_at_height: o.deposited_at_height,
                    })
                })
                .collect::<StdResult<Vec<_>>>()?;
            to_json_binary(&BribeOffersResponse { offers })
        }
        QueryMsg::BribeOffer { epoch_id, protocol } => {
            let addr = deps.api.addr_validate(&protocol)?;
            let offer = BRIBES.load(deps.storage, (epoch_id, &addr))?;
            to_json_binary(&BribeOffer {
                epoch_id: offer.epoch_id,
                protocol: offer.protocol,
                total_amount: offer.total_amount,
                deposited_at_height: offer.deposited_at_height,
            })
        }
        QueryMsg::UserReward { epoch_id, user } => {
            let user_addr = deps.api.addr_validate(&user)?;
            let claimed = CLAIMS
                .may_load(deps.storage, (epoch_id, &user_addr))?
                .unwrap_or(false);
            let total_votes = EPOCH_TOTAL_VOTES
                .may_load(deps.storage, epoch_id)?
                .unwrap_or(Uint128::zero());
            let user_weight = VOTE_WEIGHTS
                .may_load(deps.storage, (epoch_id, &user_addr))?
                .unwrap_or(Uint128::zero());

            let amount = if total_votes.is_zero() || user_weight.is_zero() {
                Uint128::zero()
            } else {
                let total_bribes: Uint128 = BRIBES
                    .prefix(epoch_id)
                    .range(deps.storage, None, None, cosmwasm_std::Order::Ascending)
                    .map(|r| r.map(|(_, o)| o.total_amount))
                    .collect::<StdResult<Vec<_>>>()?
                    .into_iter()
                    .sum();
                let cfg = CONFIG.load(deps.storage)?;
                let gross = total_bribes.multiply_ratio(user_weight, total_votes);
                let fee = gross.multiply_ratio(cfg.fee_bps, 10_000u64);
                gross - fee
            };

            to_json_binary(&UserRewardResponse { amount, claimed })
        }
        QueryMsg::Claimed { epoch_id, user } => {
            let addr = deps.api.addr_validate(&user)?;
            let claimed = CLAIMS
                .may_load(deps.storage, (epoch_id, &addr))?
                .unwrap_or(false);
            to_json_binary(&ClaimedResponse { claimed })
        }
    }
}
