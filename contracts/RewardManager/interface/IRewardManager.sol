//SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;

interface IRewardManager {

    function increaseBalance(address lender, uint amount) external;

    function claimRewards(address lender) external;

    function rewardOf(address lender) external view returns (uint[] memory);
}
