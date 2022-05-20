//SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;

interface IRewardManager {
    function registerRewardManager() external;

    function registerUser(
        address lender,
        uint deposit,
        uint40 startPeriod
    ) external;

    /**
     * @notice `claimRewardsFor` claims reward for the lender.
     * @dev All the reward are transfered to the lender.
     * @dev It can by only called by `LenderPool`.
     * @param lender, address of the lender
     */
    function claimRewardsFor(address lender) external;

    /**
     * @notice `claimRewardsFor` claims reward for the lender.
     * @dev All the reward are transfered to the lender.
     * @dev It can be directly called by lender.
     */
    function claimRewards() external;

    /**
     * @notice `increaseDeposit` increases the amount deposited by lender.
     * @dev It calls the `deposit` function of all the rewards in `RewardManager`.
     * @dev It can by only called by `LenderPool`.
     * @param lender, address of the lender
     * @param amount, amount deposited by the lender
     */
    function increaseDeposit(address lender, uint amount) external;

    /**
     * @notice `withdrawDeposit` decrease the amount deposited by the lender.
     * @dev It calls the `withdraw` function of all the rewards in `RewardManager`
     * @dev It can by only called by `LenderPool`.
     * @param lender, address of the lender
     * @param amount, amount withdrawn by the lender
     */
    function withdrawDeposit(address lender, uint amount) external;

    /**
     * @notice `pauseRewards` sets the reward for all the tokens to 0
     */
    function pauseReward() external;

    /**
     * @notice `rewardOf` returns array of reward for the lender
     * @dev It returns array of number, where each element is a reward
     * @dev For example - [stable reward, trade reward 1, trade reward 2]
     */
    function rewardOf(address lender) external view returns (uint[] memory);
}
