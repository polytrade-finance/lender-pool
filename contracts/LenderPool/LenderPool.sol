//SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;

import "./interface/ITetherToken.sol";
import "./interface/ILenderPool.sol";
import "hardhat/console.sol";

contract LenderPool is ILenderPool {
    /**
     * @dev See {ILenderPool-deposit}
     *
     * Requirements:
     *
     * - `lendingAmount` should be greater than zero
     * - `lendingAmount` must be approved from the Tether contract for the LenderPool contact
     *
     * Emits {Deposit} event
     */
    function deposit(address tetherAddress, uint lendingAmount)
        external
        payable
    {
        require(lendingAmount > 0, "Lending amount invalid");
        ITetherToken _tether = ITetherToken(tetherAddress);
        uint allowance = _tether.allowance(msg.sender, address(this));
        require(allowance >= lendingAmount, "Amount not approved");
        _tether.transferFrom(msg.sender, address(this), lendingAmount);
        emit Deposit(msg.sender, lendingAmount);
    }
}
