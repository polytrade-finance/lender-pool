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

    function increaseDeposit(address lender, uint amount)
        external
        onlyRole(LENDER_POOL)
    {
        trade.deposit(lender, amount);
        stable.deposit(lender, amount);
    }

    function withdrawDeposit(address lender, uint amount)
        external
        onlyRole(LENDER_POOL)
    {
        trade.withdraw(lender, amount);
        stable.withdraw(lender, amount);
    }

    function claimRewardsFor(address lender) external onlyRole(LENDER_POOL) {
        stable.claimReward(lender);
        trade.claimReward(lender);
    }

    function claimRewards() external {
        stable.claimReward(msg.sender);
        trade.claimReward(msg.sender);
    }

    function pauseReward() external onlyRole(LENDER_POOL) {
        stable.pauseReward();
        trade.pauseReward();
    }

    function rewardOf(address lender) external view returns (uint[] memory) {
        uint[] memory rewards = new uint[](2);
        rewards[0] = stable.rewardOf(lender);
        rewards[1] = trade.rewardOf(lender);
        return rewards;
    }
}
