//SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;

interface ILenderPool {
    /**
     * @dev Emitted when funds are deposited by the `lenderAddress`.
     * `lendingAmount` is the total amount added
     */
    event Deposit(address lenderAddress, uint lendingAmount);

    /**
     * @dev Transfer Tether token from `msg.sender` address to contract
     * @param tetherAddress, address to the stable token. (It should be constant in production)
     * @param lendingAmount, total amount that the `user` transfers to the lending pool
     */
    function deposit(address tetherAddress, uint lendingAmount)
        external
        payable;
}
