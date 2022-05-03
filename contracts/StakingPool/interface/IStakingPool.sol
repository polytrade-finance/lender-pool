//SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;

interface IStakingPool {
    /**
     * @notice
     * @dev
     * @param amount,
     */
    event Deposit(uint amount);

    /**
     * @notice
     * @dev
     * @param amount,
     */
    event Withdraw(uint amount);

    /**
     * @notice
     * @dev
     * @param amount,
     */
    function deposit(uint amount) external;

    /**
     * @notice
     * @dev
     * @param amount,
     */
    function withdraw(uint amount) external;
}
