//SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;

interface IRewardManager {
    function claimRewards(address lender) external;

    function updateRound(address lender) external;

    function increaseDeposit(address lender, uint amount) external;

    function rewardOf(address lender) external view returns (uint[] memory);

    function withdrawDeposit(address lender, uint amount) external;
}
