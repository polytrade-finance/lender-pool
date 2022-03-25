//SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;

interface ILenderPool {
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
     * @notice Emits when new rewardAPY is set
     * @dev Emmited when new rewardAPY is set by the owner
     * @param rewardAPY, new value of rewardAPY
     */
    event NewRewardAPY(uint rewardAPY);

    /**
     * @notice Deposit stable token to smart contract
     * @dev Transfers the approved stable token from msg.sender to lender pool
     * @param amount, the number of stable token to be deposited
     *
     * Requirements:
     *
     * - `amount` should be greater than zero
     * - `amount` must be approved from the stable token contract for the LenderPool contact
     *
     * Emits {Deposit} event
     */
    function deposit(uint amount) external;

    /**
     * @notice converts all the deposited stable token into tStable token and transfers them to the lender
     * @dev calculates the tStable token lender can claim and transfers them to the lender
     *
     * Requirements:
     *
     * - `deposit` should be greater than zero
     *
     * Emits {Withdraw} event
     */
    function withdrawAllTStable() external;

    /**
     * @notice converts the given amount of stable token into tStable token and transfers to lender
     * @dev checks the required condition and converts stable token to tstable and transfers to lender
     * @param amount, total amount of stable token to be converted to tStable token
     *
     * Requirements:
     *
     * - `deposit` should be greater than tStable amount requested
     *
     * Emits {Withdraw} event
     */
    function withdrawTStable(uint amount) external;

    /**
     * @notice tranfer lender all the reward
     * @dev update the pendingReward and transfers reward in tStable token to lender
     *
     * Requirements:
     *
     * - `_pendingReward` should be greater than 0
     *
     * Emits {Withdraw} event
     */
    function withdrawReward() external;

    /**
     * @notice set the value of rewardAPY
     * @dev set the value of rewardAPY to _rewardAPY, only owner can call
     * @param _rewardAPY, new value of new rewardAPY
     */
    function setAPY(uint _rewardAPY) external;

    /**
     * @notice returns value of rewardAPY
     * @return returns value of rewardAPY
     */
    function getAPY() external view returns (uint);

    /**
     * @notice returns amount of stable token deposited by the lender
     * @param lender, address of lender
     * @return returns amount of stable token deposited by the lender
     */
    function getDeposit(address lender) external view returns (uint);

    /**
     * @notice returns the total pending reward
     * @dev returns the total pending reward of msg.sender
     * @return returns the total pending reward
     */
    function getReward() external view returns (uint);
}
