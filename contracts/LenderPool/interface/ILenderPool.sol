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
     * @notice Deposit stable token to smart contract
     * @dev Transfers the approved stable token from msg.sender to lender pool
     * @param amount, the number of stable token to be lent
     */
    function deposit(uint amount) external;

    /**
     * @notice converts all stable token deposited into tStable token and transfers to lender
     * @dev calculates the total tStable token lender can claim and transfers it to lender
     */
    function withdrawAllTStable() external;

    /**
     * @notice converts the given amount of stable token into tStable token and transfers to lender
     * @dev checks the required condition and converts stable token to tstable and transfers to lender
     * @param amount, total amount to stable token to converted to tStable token
     */
    function withdrawTStable(uint amount) external;

    /**
     * @notice returns stable token lent by the lender
     * @param lender, address of lender
     * @return returns the stable token by the lender
     */
    function getDeposit(address lender) external view returns (uint);
}
