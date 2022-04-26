//SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;

import "./interface/IRedeemPool.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "../Token/interface/IToken.sol";

/**
 * @author Polytrade
 * @title RedeemPool
 */
contract RedeemPool is IRedeemPool, Ownable {
    using SafeERC20 for IToken;

    IToken public immutable stable;
    IToken public immutable tStable;

    mapping(address => bool) public lenderPool;

    constructor(address _stableAddress, address _tStableAddress) {
        stable = IToken(_stableAddress);
        tStable = IToken(_tStableAddress);
    }

    /**
     * @notice exchange tStable token for the stable token
     * @dev users can directly call this function using EOA after approving `amount`
     * @param amount, the number of tokens to be exchanged
     */
    function convertToStable(uint amount) external {
        _convertToStable(amount, msg.sender);
    }

    /**
     * @notice exchange tStable token for the stable token
     * @dev burns the tStable from msg.sender and sends stable to `account`
     * @param amount, the number of tokens to be exchanged
     * @param account, address of the account that will receive the stable token
     */
    function toStable(uint amount, address account) external {
        _convertToStable(amount, account);
    }

    /**
     * @notice exchange tStable token for the stable token
     * @dev Transfers the approved tStable token from account to redeem pool and burn it
     * @dev Transfers the  equivalent amount of stable token from redeem pool to account
     * @param amount, the number of tokens to be exchanged
     * @param account, address of the account that will receive the stable token
     *
     * Requirements:
     *
     * - `amount` should be greater than zero
     * - `amount` must be approved from the tStable token contract for the RedeemPool contract
     * - `amount` must be less than balanceOf stable token of Redeem Pool
     *
     * Emits {StableWithdrawn} event
     */
    function _convertToStable(uint amount, address account) private {
        require(
            tStable.balanceOf(msg.sender) >= amount,
            "Insufficient balance"
        );
        require(
            tStable.allowance(msg.sender, address(this)) >= amount,
            "Insufficient allowance"
        );
        require(amount > 0, "Amount is 0");
        require(
            stable.balanceOf(address(this)) >= amount,
            "Insufficient balance in pool"
        );
        tStable.burnFrom(msg.sender, amount);
        stable.safeTransfer(account, amount);
        emit StableWithdrawn(amount);
    }
}
