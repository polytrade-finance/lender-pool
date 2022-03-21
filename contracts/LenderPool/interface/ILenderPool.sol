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
     * @notice Deposit stable to smart contract
     * @dev Transfers the approved stable from msg.sender to lender pool
     * @param amount, the number of stable to be lent
     */
    function deposit(uint amount) external;

    /*
     *@notice converts the stable into derivative and transfers to lender
     *@dev calculates the total derivative lender can claim and transfers it to lender
     */
    function convertToDerivative() external;

    /**
     * @notice returns amount lent by the lender
     * @param lender, address of lender
     * @return returns the amount lent by the lender
     */
    function getBalance(address lender) external view returns (uint);
}
