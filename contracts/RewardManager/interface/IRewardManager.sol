//SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;

interface IRewardManager {
    function claimRewards(address lender) external;

    function claimRewards() external;

    function increaseDeposit(address lender, uint amount) external;

    function withdrawDeposit(address lender, uint amount) external;

    function pauseReward() external;

    function rewardOf(address lender) external view returns (uint[] memory);
}
