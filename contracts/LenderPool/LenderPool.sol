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
    mapping(address => uint) private _derivativeClaimed;

    IERC20 public immutable token;
    IERC20 public immutable derivative;

    constructor(address _tokenAddress, address _derivativeAddress) {
        token = IERC20(_tokenAddress);
        derivative = IERC20(_derivativeAddress);
    }

    /**
     * @notice Deposit token to smart contract
     * @dev Transfers the approved token from msg.sender to lender pool
     * @param amount, the number of tokens to be lent
     *
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
        emit Deposit(msg.sender, amount);
        token.safeTransferFrom(msg.sender, address(this), amount);
    }

    /*
     *@notice converts the token into derivative and transfers to lender
     *@dev calculates the total derivative lender can claim and transfers it to lender
     */
    function convertToDerivative() external {
        require(_deposits[msg.sender] > 0, "No deposit made");
        require(
            _deposits[msg.sender] == _derivativeClaimed[msg.sender],
            "Derivative already claimed"
        );
        uint amount = _deposits[msg.sender] - _derivativeClaimed[msg.sender];
        _derivativeClaimed[msg.sender] += amount;
        derivative.safeTransferFrom(msg.sender, address(this), amount);
        emit DerivativeClaimed(msg.sender, amount);
    }

    /**
     * @notice returns amount lent by the lender
     * @param lender, address of the lender
     * @return returns the amount lent by the lender
     */
    function getBalance(address lender) external view returns (uint) {
        return _deposits[lender];
    }
}
