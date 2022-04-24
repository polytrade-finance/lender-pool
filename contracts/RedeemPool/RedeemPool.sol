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
    
    mapping(address=>bool) public lenderPool;
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
     * - `amount` must be approved from the stable token contract for the RedeemPool contract
     *
     * Emits {StableDeposited} event
     */
    function depositStable(uint amount) external {
        require(amount > 0, "Amount is 0");
        require(
            stable.allowance(msg.sender, address(this)) >= amount,
            "Not enough allowance"
        );
        stable.safeTransferFrom(msg.sender, address(this), amount);
        emit StableDeposited(amount);
    }

    function setLenderPool(address poolAddress) external onlyOwner{
        lenderPool[poolAddress] = true;
    }

    function deletePoolAddress(address poolAddress) external onlyOwner{
        lenderPool[poolAddress] = false;
    }

    /**
     * @notice exchange tStable token for the stable token
     * @dev users can directly call this function using EOA
     * @param amount, the number of tokens to be exchanged
     */
    function convertToStable(uint amount) external {
        _convertToStable(amount, msg.sender);
    }

    /**
     * @notice exchange tStable token for the stable token
     * @dev this function can be called using another smart contract
     * @param amount, the number of tokens to be exchanged
     */
    function toStable(uint amount, address account) external {
        require(lenderPool[msg.sender],"Invalid pool address");
        _convertToStable(amount, account);
    }

    /**
     * @notice exchange tStable token for the stable token
     * @dev Transfers the approved tStable token from account to redeem pool and burn it
     * @dev Transfers the  equivalent amount of stable token from redeem pool to account
     * @param amount, the number of tokens to be exchanged
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
        require(amount > 0, "Amount is 0");
        require(
            stable.balanceOf(address(this)) >= amount,
            "Insufficient balance in pool"
        );
        tStable.burnFrom(account, amount);
        stable.safeTransfer(account, amount);
        emit StableWithdrawn(amount);
    }
}
