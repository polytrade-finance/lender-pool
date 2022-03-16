//SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;

import "./interface/ITetherToken.sol";
import "./interface/ILenderPool.sol";
import "hardhat/console.sol";

contract LenderPool is ILenderPool {
    /**
     *
     */
    function deposit(address tetherAddress, uint lendingAmount)
        external
        payable
    {
        ITetherToken _tether = ITetherToken(tetherAddress);
        uint allowance = _tether.allowance(msg.sender, address(this));
        require(allowance >= lendingAmount, "Amount not approved");
        _tether.transferFrom(msg.sender, address(this), lendingAmount);
    }
}
