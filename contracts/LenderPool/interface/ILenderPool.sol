//SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;

interface ILenderPool {
    /*
     *
     */
    function deposit(address tetherAddress, uint lendingAmount)
        external
        payable;
}
