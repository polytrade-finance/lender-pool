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

    function deposit(address lender, uint amount) external;

    function withdraw(address lender, uint amount) external;

    function claimReward(address lender, uint amount) external;

    function setReward(uint16 tradeRate) external;

    function rewardOf(address lender) external view returns (uint);
}
