//SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./interface/ILenderPool.sol";

/**
 * @author Polytrade
 * @title LenderPool V2
 */
contract LenderPool is ILenderPool {
    using SafeERC20 for IERC20;

    mapping(address => uint) private _deposits;

    IERC20 public immutable token;

    constructor(address _tokenAddress) {
        token = IERC20(_tokenAddress);
    }

    /**
     * @notice Deposit token to smart contract
     * @dev Transfers the approved token from msg.sender to lender pool
     * @param amount, the number of tokens to be lent


     * Requirements:
     *
     * - `lendingAmount` should be greater than zero
     * - `lendingAmount` must be approved from the token contract for the LenderPool contact
     *
     * Emits {Deposit} event
     */
    function deposit(uint amount) external {
        require(amount > 0, "Lending amount invalid");
        uint allowance = token.allowance(msg.sender, address(this));
        require(allowance >= amount, "Amount not approved");
        _deposits[msg.sender] += amount;
        token.safeTransferFrom(msg.sender, address(this), amount);
        emit Deposit(msg.sender, amount);
    }

    /**
     * @notice returns the total amount lent by the lender
     * @param lender, address of the lender
     * @return returns balance of the lender
     */
    function getBalance(address lender) external view returns (uint) {
        return _deposits[lender];
    }
}
