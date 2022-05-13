//SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;

interface ILenderPool {
    struct Lender {
        uint16 round;
        uint40 startPeriod;
        uint pendingRewards;
        uint deposit;
    }

    struct RoundInfo {
        uint16 apy;
        uint40 startTime;
        uint40 endTime;
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
     * @param oldVerificationAddress, old verification Address
     * @param newVerificationAddress, new verification Address
     */
    event VerificationContractUpdated(
        address oldVerificationAddress,
        address newVerificationAddress
    );

    /**
     * @notice Emits when new kyc Limit is set
     * @dev Emitted when new kycLimit is set by the owner
     * @param kycLimit, new value of kycLimit
     */
    event NewKYCLimit(uint kycLimit);

    /**
     * @notice Emits when new rewardAPY is set
     * @dev Emitted when new rewardAPY is set by the owner
     * @param rewardAPY, new value of rewardAPY
     */
    event NewRewardAPY(uint16 rewardAPY);

    /**
     * @notice Emitted when straking strategy is switched
     * @dev Emitted when switchStrategy function is called by owner
     * @param oldStakingStrategy, address of the old staking strategy
     * @param newStakingStrategy, address of the new staking strategy
     */
    event SwitchStrategy(
        address oldStakingStrategy,
        address newStakingStrategy
    );

    /**
     * @notice switch the strategy, withdraws all reward and deposit to new strategy
     * @dev can be called by only owner
     * @param newStakingStrategy, address of the new staking strategy
     * Emits {SwitchStrategy} event
     */
    function switchStrategy(address newStakingStrategy) external;

    /**
     * @notice deposit stable token to staking pool
     * @dev only owner can call this function
     * @param amount, total amount to deposit
     */
    function depositInStakingStrategy(uint amount) external;

    /**
     * @notice deposit all stable token to staking strategy
     * @dev only owner can call this function
     */
    function depositAllInStakingStrategy() external;

    /**
     * @notice withdraw all stable token from staking strategy
     * @dev only owner can call this function
     */
    function withdrawAllFromStakingStrategy() external;

    /**
     * @notice withdraw stable token from staking pool
     * @dev only owner can call this function
     * @param amount, total amount to be withdrawn from staking strategy
     */
    function withdrawFromStakingStrategy(uint amount) external;

    /**
     * @notice Deposit stable token to smart contract
     * @dev Transfers the approved stable token from msg.sender to lender pool
     * @param amount, the number of stable token to be deposited
     *
     * Requirements:
     *
     * - `amount` should be greater than zero
     * - `amount` must be approved from the stable token contract for the LenderPool contract
     *
     * Emits {Deposit} event
     */
    function deposit(uint amount) external;

    /**
     * @notice converts all the deposited stable token into tStable token and transfers to the lender
     * @dev calculates the tStable token lender can claim and transfers it to the lender
     */
    function withdrawAllTStable() external;

    /**
     * @notice converts the given amount of stable token into tStable token and transfers to lender
     * @dev checks the required condition and converts stable token to tStable and transfers to lender
     * @param amount, total amount of stable token to be converted to tStable token
     */
    function withdrawTStable(uint amount) external;

    /**
     * @notice send lender all the reward
     * @dev update the pendingReward and mint tStable token and send to lender
     *
     * Emits {Withdraw} event
     */
    function claimRewards() external;

    /**
     * @notice adds a new round
     * @dev increment currentRound and adds a new round, only owner can call
     * @param _rewardAPY, new value of new round.apy
     *
     * Emits {NewRewardAPY} event
     */
    function setAPY(uint16 _rewardAPY) external;

    /**
     * @notice transfers user all the reward in stable token
     * @dev calculates and mint the reward
     * @dev calls redeemStableTo function from RedeemPool to convert tStable to stable
     *
     * Requirements:
     *
     * - total reward should be not more than stable tokens in RedeemPool
     *
     */
    function redeemAll() external;

    /**
     * @notice returns value of APY of current round
     * @return returns value of APY of current round
     */
    function getAPY() external view returns (uint16);

    /**
     * @notice returns amount of stable token deposited by the lender
     * @param lender, address of lender
     * @return returns amount of stable token deposited by the lender
     */
    function getDeposit(address lender) external view returns (uint);
}
