//SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;

import "./interface/IRedeemPool.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "../Token/interface/IToken.sol";

/**
 * @author Polytrade
 * @title RedeemPool 
 */
contract RedeemPool is IRedeemPool {
    using SafeERC20 for IToken;

    IToken public immutable stable;
    IToken public immutable tStable;

    constructor(address _stableAddress, address _tStableAddress) {
        stable = IToken(_stableAddress);
        tStable = IToken(_tStableAddress);
    }

    /**
     * @notice Deposit stable token to smart contract
     * @dev Transfers the approved stable token from msg.sender to redeem pool
     * @param amount, the number of stable token deposited
     *
     * Requirements:
     *
     * - `amount` should be greater than zero
     * - `amount` must be approved from the stable token contract for the RedeemPool contact
     *
     * Emits {StableDeposited} event    
     */
    function depositStable(uint amount) external {
        require(amount > 0, "Lending amount is 0");
        uint allowance = stable.allowance(msg.sender, address(this));
        require(allowance >= amount, "Not enough allowance");
        stable.safeTransferFrom(msg.sender, address(this), amount);
        emit StableDeposited(amount);
    }

    /**
     * @notice exchange tStable token for the stable token 
     * @dev Transfers the approved tStable token from msg.sender to redeem pool and burn it
     * @dev Transfers the  equivalent amount of stable token from redeem pool to msg.sender
     * @param amount, the number of tokens to be exchanged
     *
     * Requirements:
     *
     * - `amount` should be greater than zero
     * - `amount` must be approved from the tStable token contract for the RedeemPool contact
     * - `amount` must be less than balanceOf stable token of Redeem Pool
     *
     * Emits {StableWithdrawn} event    
     */
    function getStable(uint amount) external {
        require(amount > 0, "Lending amount is 0");
        uint balance = stable.balanceOf(address(this));
        require(balance >= amount, "insufficient balance in pool");
        uint allowance = tStable.allowance(msg.sender, address(this));
        require(allowance >= amount, "allowance less than amount");
        tStable.burn(msg.sender, amount);
        stable.safeTransfer(msg.sender, amount);
        emit StableWithdrawn(amount);
    }
}
