//SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./interface/ILenderPool.sol";

/**
 * @author Polytrade
 * @title LenderPool V2
 */
contract LenderPool is ILenderPool {
    using SafeERC20 for IERC20;

    mapping(address => uint) private _balance;

    address public immutable tokenAddress;

    constructor(address _tokenAddress) {
        tokenAddress = _tokenAddress;
    }

    /**
     * @notice Deposit token to smart contract
     * @dev Transfers the approved token from msg.sender to lender pool
     * @param amount, The number of tokens user wants to transfer
     * Requirements:
     *
     * - `lendingAmount` should be greater than zero
     * - `lendingAmount` must be approved from the token contract for the LenderPool contact
     *
     * Emits {Deposit} event
     */
    function deposit(uint amount) external {
        require(amount > 0, "Lending amount invalid");
        IERC20 _token = IERC20(tokenAddress);
        uint allowance = _token.allowance(msg.sender, address(this));
        require(allowance >= amount, "Amount not approved");
        _token.safeTransferFrom(msg.sender, address(this), amount);
        _balance[msg.sender] += amount;
        emit Deposit(msg.sender, amount);
    }

    /**
     * @notice returns the total amount lent by lender
     * @param lender, address of lender
     * @return returns the balance of lender
     */
    function getBalance(address lender) external view returns (uint) {
        return _balance[lender];
    }
}
