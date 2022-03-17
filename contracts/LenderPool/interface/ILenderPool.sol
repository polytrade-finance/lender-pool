//SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;

interface ILenderPool {
    /**
     * @notice Emits when new fund is added to Lender Pool
     * @dev Emitted when funds are deposited by the `lenderAddress`.
     * `lendingAmount` is the total amount added
     */
    event Deposit(address indexed lenderAddress, uint lendingAmount);

    /**
     * @notice Deposit token to smart contract
     * @dev Transfers the approved token from msg.sender to lender pool
     * @param amount The number of tokens user wants to transfer
     */
    function deposit(uint amount) external;

    /**
     * @notice returns the total amount lent by lender
     * @param lender address of lender
     * @return returns the balance of lender
     */
    function getBalance(address lender) external view returns (uint);
}
