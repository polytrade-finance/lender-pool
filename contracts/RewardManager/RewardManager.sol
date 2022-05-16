//SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;

import "./interface/IRewardManager.sol";
import "../Reward/interface/IReward.sol";

contract RewardManager is IRewardManager {
    IReward public stableReward;
    IReward public tradeReward;

    constructor(address _stableReward, address _tradeReward) {
        stableReward = IReward(_stableReward);
        tradeReward = IReward(_tradeReward);
    }

    function claimRewards(address lender) external {
        stableReward.claimReward(lender, stableReward.rewardOf(lender));
        tradeReward.claimReward(lender, tradeReward.rewardOf(lender));
    }

    function rewardOf(address lender) external view returns (uint[] memory) {
        uint[] memory rewards = new uint[](2);
        rewards[0] = stableReward.rewardOf(lender);
        rewards[1] = tradeReward.rewardOf(lender);
        return rewards;
    }
}
