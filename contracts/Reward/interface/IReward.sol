//SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;

interface IReward {
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
     * @notice increases the `lender` deposit by `amount`
     * @dev can be called by LENDER_POOL only
     * @param lender, address of the lender
     * @param amount, amount deposited by lender
     */
    function deposit(address lender, uint amount) external;

    /**
     * @notice withdraws the `amount` from `lender`
     * @dev can be called by LENDER_POOL only
     * @param lender, address of the lender
     * @param amount, amount deposited by lender
     */
    function withdraw(address lender, uint amount) external;

    /**
     * @notice send lender reward and update the pendingReward
     * @dev can be called by LENDER_POOL only
     * @param lender, address of the lender
     * @param amount, amount deposited by lender
     */
    function claimReward(address lender, uint amount) external;

    /**
     * @notice sets the reward (APY in case of tStable, trade per year per stable in case of trade reward)
     * @dev only OWNER can call setReward
     * @param reward, current reward offered by the contract
     */
    function setReward(uint16 reward) external;

    function updatePendingReward(address lender) external;

    /**
     * @notice returns the total pending reward
     * @dev returns the total pending reward of msg.sender
     * @param lender, address of the lender
     * @return returns the total pending reward
     */
    function rewardOf(address lender) external view returns (uint);
}
