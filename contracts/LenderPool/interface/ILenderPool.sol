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

    /*
     * @notice Emits when derivative token is transferred.
     * @dev Emitted when derivative token is claimed and then transferred to lender.
     * @param lender, address of the lender
     * @param amount, amount transferred to the lender
     */
    event DerivativeClaimed(address indexed lender, uint amount);

    /**
     * @notice Deposit token to smart contract
     * @dev Transfers the approved token from msg.sender to lender pool
     * @param amount, the number of tokens to be lent
     */
    function deposit(uint amount) external;

    /*
     *@notice converts the token into derivative and transfers to lender
     *@dev calculates the total derivative lender can claim and transfers it to lender
     */
    function convertToDerivative() external;

    /**
     * @notice returns amount lent by the lender
     * @param lender, address of lender
     * @return returns the amount lent by the lender
     */
    function getBalance(address lender) external view returns (uint);

    /**
     * @notice retruns the amount of derivative claimed
     * @param lender, address of the lender
     * @return retruns the amount of derivative claimed
     */
    function getDerivativeClaimed(address lender) external view returns (uint);
}
