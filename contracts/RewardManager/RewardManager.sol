//SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;

import "./interface/IRewardManager.sol";
import "../Reward/interface/IReward.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract RewardManager is IRewardManager, AccessControl {
    IReward public stableReward;
    IReward public tradeReward;

    bytes32 public constant LENDER_POOL = keccak256("LENDER_POOL");

    constructor(address _stableReward, address _tradeReward) {
        stableReward = IReward(_stableReward);
        tradeReward = IReward(_tradeReward);
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    function claimRewards(address lender) external onlyRole(LENDER_POOL){
        stableReward.claimReward(lender, stableReward.rewardOf(lender), true);
        tradeReward.claimReward(lender, tradeReward.rewardOf(lender), false);
    }

    function rewardOf(address lender) external view returns (uint[] memory) {
        uint[] memory rewards = new uint[](2);
        rewards[0] = stableReward.rewardOf(lender);
        rewards[1] = tradeReward.rewardOf(lender);
        return rewards;
    }
}
