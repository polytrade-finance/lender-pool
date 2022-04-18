//SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;

import "./interface/IRedeemPool.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "../Token/interface/IToken.sol";

contract RedeemPool is IRedeemPool {
    using SafeERC20 for IToken;

    IToken public immutable stable;
    IToken public immutable tStable;

    constructor(address _stableAddress, address _tStableAddress) {
        stable = IToken(_stableAddress);
        tStable = IToken(_tStableAddress);
    }

    /**
    * @notice
    * @dev
    * @param amount
    */
    function depositStable(uint amount) external {
        require(amount > 0, "Invalid amount");
        uint allowance = stable.allowance(msg.sender, address(this));
        require(allowance >= amount, "Not enough allowance");
        stable.safeTransferFrom(msg.sender, address(this), amount);
        emit StableDeposited(amount);
    }

    /**
    * @notice
    * @dev
    * @param amount
    */
    function getStable(uint amount) external {
        uint balance = stable.balanceOf(address(this));
        require(balance >= amount, "insufficient balance in pool");
        uint allowance = tStable.allowance(msg.sender, address(this));
        require(allowance >= amount, "allowance less than amount");
        tStable.burn(msg.sender, amount);
        stable.safeTransfer(msg.sender, amount);
        emit StableWithdrawn(amount);
    }
}
