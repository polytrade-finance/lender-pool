//SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;

interface ILenderPool {
    /**
     * @notice Emits when new fund is added to the Lender Pool
     * @dev Emitted when funds are deposited by the `lender`.
     * @param lender, address of the lender
     * @param amount, amount deposited by the lender
     */
    event Deposit(address indexed lender, uint amount);

    /**
     * @notice Deposit token to smart contract
     * @dev Transfers the approved token from msg.sender to lender pool
     * @param amount, the number of tokens to be lent
     */
    function deposit(uint amount) external;

    /**
     * @notice returns amount lent by the lender
     * @param lender, address of lender
     * @return returns balance of the lender
     */
    function getBalance(address lender) external view returns (uint);
}
