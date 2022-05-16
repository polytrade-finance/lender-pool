//SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;

import "./interface/IRewardManager.sol";
import "../Reward/interface/IReward.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract RewardManager is IRewardManager, AccessControl {
    IReward public stable;
    IReward public trade;

    bytes32 public constant LENDER_POOL = keccak256("LENDER_POOL");

    constructor(address _stable, address _trade) {
        stable = IReward(_stable);
        trade = IReward(_trade);
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    function increaseBalance(address lender, uint amount) external {
        trade.deposit(lender, amount);
        stable.deposit(lender, amount);
    }

    function updatePendingReward(address lender) external {
        trade.updatePendingReward(lender);
        stable.updatePendingReward(lender);
    }

    function updateRound(address lender) external {
//        trade.updateRound(lender);
//        stable.updateRound(lender);
    }

    function claimRewards(address lender) external
//    onlyRole(LENDER_POOL)
    {
        trade.claimReward(lender, trade.rewardOf(lender));
        stable.claimReward(lender, stable.rewardOf(lender));
    }

    function rewardOf(address lender) external view returns (uint[] memory) {
        uint[] memory rewards = new uint[](2);
        rewards[0] = stable.rewardOf(lender);
        rewards[1] = trade.rewardOf(lender);
        return rewards;
    }
}
