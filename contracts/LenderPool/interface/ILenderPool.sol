//SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;

interface ILenderPool {
    struct Lender {
        uint deposit;
        uint40 time;
    }

    /**
     * @notice Emits when new fund is added to the Lender Pool
     * @dev Emitted when funds are deposited by the `lender`.
     * @param lender, address of the lender
     * @param amount, stable token deposited by the lender
     */
    event Deposit(address indexed lender, uint amount);

    /**
     * @notice Emits when fund is withdrawn by the lender
     * @dev Emitted when tStable token are withdrawn by the `lender`.
     * @param lender, address of the lender
     * @param amount, tStable token withdrawn by the lender
     */
    event Withdraw(address indexed lender, uint amount);

    /**
     * @notice Emits when new DepositLimit is set
     * @dev Emitted when new DepositLimit is set by the owner
     * @param oldVerification, old verification Address
     * @param newVerification, new verification Address
     */
    event VerificationSwitched(
        address oldVerification,
        address newVerification
    );

    /**
     * @notice Emitted when staking strategy is switched
     * @dev Emitted when switchStrategy function is called by owner
     * @param oldStrategy, address of the old staking strategy
     * @param newStrategy, address of the new staking strategy
     */
    event StrategySwitched(address oldStrategy, address newStrategy);

    event RewardManagerSwitched(
        address oldRewardManager,
        address newRewardManager
    );

    /**
     * @notice `deposit` is used by lenders to depsoit stable token to smart contract.
     * @dev It transfers the approved stable token from msg.sender to lender pool.
     * @param amount, The number of stable token to be deposited.
     *
     * Requirements:
     *
     * - `amount` should be greater than zero.
     * - `amount` must be approved from the stable token contract for the LenderPool.
     * - `amount` should be less than validation limit or KYC needs to be completed.
     *
     * Emits {Deposit} event
     */
    function deposit(uint amount) external;

    /**
     * @notice `withdrawAllDeposit` send lender tStable equivalent to stable deposited.
     * @dev It mints tStable and sends to lender.
     * @dev It sets the amount deposited by lender to zero.
     *
     * Emits {Withdraw} event
     */
    function withdrawAllDeposit() external;

    /**
     * @notice `withdrawDeposit` send lender tStable equivalent to stable requested.
     * @dev It mints tStable and sends to lender.
     * @dev It decreases the amount deposited by lender.
     * @param amount, Total token requested by lender.
     *
     * Requirements:
     * - `amount` should be greater than 0.
     * - `amount` should be not greater than deposited.
     *
     * Emits {Withdraw} event
     */
    function withdrawDeposit(uint amount) external;

    /**
     * @notice `claimRewards` transfers lender all the reward.
     * @dev It calls `claimRewardsFor` from `RewardManager`.
     * @dev RewardManager may be changed by LenderPool's owner.
     * @dev User can obtain reward from old `RewardManager` by calling `claimRewards` function.
     */
    function claimRewards() external;

    /**
     * @notice `redeemAll` call transfers all reward and deposited amount in stable token.
     * @dev It converts the tStable to stable using `RedeemPool`.
     * @dev It calls `claimRewardsFor` from `RewardManager`.
     *
     * Requirements :
     * - `RedeemPool` should have stable tokens more than lender deposited.
     *
     */
    function redeemAll() external;

    /**
     * @notice `switchRewardManager` is used to switch reward manager.
     * @dev It pauses reward for previous `RewardManager` and initializes new `RewardManager` .
     * @dev It can be called by only owner of LenderPool.
     * @dev Changed `RewardManager` contract must complies with `IRewardManager`.
     * @param newRewardManager, Addess of the new `RewardManager`.
     *
     * Emits {RewardManagerSwitched} event
     */
    function switchRewardManager(address newRewardManager) external;

    function switchVerification(address newVerification) external;

    /**
     * @notice `switchStrategy` is used for switching the strategy.
     * @dev It moves all the funds from the old strategy to the new strategy.
     * @dev It can be called by only owner of LenderPool.
     * @dev Changed strategy contract must complies with `IStrategy`.
     * @param newStrategy, address of the new staking strategy.
     *
     * Emits {StrategySwitched} event
     */
    function switchStrategy(address newStrategy) external;

    /**
     * @notice `depositInStrategy` deposits funds in strategy.
     * @dev Funds will be deposited to external protocol like aave, compund
     * @dev It transfers token from `LenderPool` to external protocol.
     * @dev It can be called by only owner of LenderPool.
     * @param amount, amount to be deposited in strategy.
     */
    function depositInStrategy(uint amount) external;

    /**
     * @notice `withdrawFromStrategy`  withdraws all funds from external protocol.
     * @dev It transfers all funds from external protocol to `LenderPool`.
     * @dev It can be called by only owner of LenderPool.
     * @param amount, total amount to be withdrawn from staking strategy.
     *
     * Requirements:
     * - Total amount in external protcol should be less than `amount` requested.
     *
     */
    function withdrawFromStrategy(uint amount) external;

    /**
     * @notice `rewardOf` returns the total reward of the lender
     * @dev It returns array of number, where each element is a reward
     * @dev For example - [stable reward, trade reward 1, trade reward 2]
     * @return Returns the total pending reward
     */
    function rewardOf(address lender) external returns (uint[] memory);

    /**
     * @notice `getStrategyBalance` Reurns total balance of lender in external protocol
     * @return Reurns total balance of lender in external protocol
     */
    function getStrategyBalance() external view returns (uint);

    /**
     * @notice `getDeposit` returns total amount deposited by the lender
     * @param lender, address of the lender
     * @return returns amount of stable token deposited by the lender
     */
    function getDeposit(address lender) external view returns (uint);
}
