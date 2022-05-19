//SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;

import "./interface/IRewardManager.sol";
import "../Reward/interface/IReward.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @author Polytrade
 * @title Reward Manager V2
 */
contract RewardManager is IRewardManager, AccessControl {
    IReward public stable;
    IReward public trade;

    bytes32 public constant LENDER_POOL = keccak256("LENDER_POOL");

    constructor(address _stable, address _trade) {
        stable = IReward(_stable);
        trade = IReward(_trade);
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    /**
     * @notice `increaseDeposit` increases the amount deposited by lender.
     * @dev It calls the `deposit` function of all the rewards in `RewardManager`.
     * @dev It can by only called by `LenderPool`.
     * @param lender, address of the lender 
     * @param amount, amount deposited by the lender
     */
    function increaseDeposit(address lender, uint amount)
        external
        onlyRole(LENDER_POOL)
    {
        trade.deposit(lender, amount);
        stable.deposit(lender, amount);
    }

    /**
     * @notice `withdrawDeposit` decrease the amount deposited by the lender.
     * @dev It calls the `withdraw` function of all the rewards in `RewardManager`
     * @dev It can by only called by `LenderPool`.
     * @param lender, address of the lender 
     * @param amount, amount withdrawn by the lender
     */
    function withdrawDeposit(address lender, uint amount)
        external
        onlyRole(LENDER_POOL)
    {
        trade.withdraw(lender, amount);
        stable.withdraw(lender, amount);
    }

    /**
     * @notice `claimRewardsFor` claims reward for the lender.
     * @dev All the reward are transfered to the lender.
     * @dev It can by only called by `LenderPool`.
     * @param lender, address of the lender
     */
    function claimRewardsFor(address lender) external onlyRole(LENDER_POOL) {
        stable.claimReward(lender);
        trade.claimReward(lender);
    }

    /**
     * @notice `claimRewardsFor` claims reward for the lender.
     * @dev All the reward are transfered to the lender.
     * @dev It can be directly called by lender.
     */
    function claimRewards() external {
        stable.claimReward(msg.sender);
        trade.claimReward(msg.sender);
    }

    /**
     * @notice `pauseRewards` sets the reward for all the tokens to 0 
     */
    function pauseReward() external onlyRole(LENDER_POOL) {
        stable.pauseReward();
        trade.pauseReward();
    }

    /**
     * @notice `rewardOf` returns array of reward for the lender 
     * @dev It returns array of number, where each element is a reward
     * @dev For example - [stable reward, trade reward 1, trade reward 2]
     */
    function rewardOf(address lender) external view returns (uint[] memory) {
        uint[] memory rewards = new uint[](2);
        rewards[0] = stable.rewardOf(lender);
        rewards[1] = trade.rewardOf(lender);
        return rewards;
    }
}
