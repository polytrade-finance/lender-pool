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

    IERC20 public immutable stable;
    IERC20 public immutable tStable;

    constructor(address _stableAddress, address _tStableAddress) {
        stable = IERC20(_stableAddress);
        tStable = IERC20(_tStableAddress);
    }

    /**
     * @notice Deposit stable token to smart contract
     * @dev Transfers the approved stable token from msg.sender to lender pool
     * @param amount, the number of stable token to be lent
     *
     * Requirements:
     *
     * - `lendingAmount` should be greater than zero
     * - `lendingAmount` must be approved from the stable token  contract for the LenderPool contact
     *
     * Emits {Deposit} event
     */
    function deposit(uint amount) external {
        require(amount > 0, "Lending amount invalid");
        uint allowance = stable.allowance(msg.sender, address(this));
        require(allowance >= amount, "Amount not approved");
        _deposits[msg.sender] += amount;
        emit Deposit(msg.sender, amount);
        stable.safeTransferFrom(msg.sender, address(this), amount);
    }

    /**
     * @notice converts the stable token into tStable token and transfers to lender
     * @dev calculates the total tStable token lender can claim and transfers it to lender
     *
     * Requirements:
     *
     * - `deposit` should be greater than zero
     *
     */
    function withdrawAllTStable() external {
        require(_deposits[msg.sender] > 0, "No deposit made");
        uint amount = _deposits[msg.sender];
        _deposits[msg.sender] = 0;
        tStable.safeTransfer(msg.sender, amount);
    }

    /**
     * @notice converts the given amount of stable token into tStable token and transfers to lender
     * @dev checks the required condition and converts stable token to tstable and transfers to lender
     * @param amount, total amount to stable token to converted to tStable token
     *
     * Requirements:
     *
     * - `deposit` should be greater than tStable amount requested
     *
     */
    function withdrawTStable(uint amount) external {
        require(_deposits[msg.sender] >= amount, "Invalid amount requested");
        _deposits[msg.sender] -= amount;
        tStable.safeTransfer(msg.sender, amount);
    }

    /**
     * @notice returns stable token lent by the lender
     * @param lender, address of the lender
     * @return returns the stable token lent by the lender
     */
    function getDeposit(address lender) external view returns (uint) {
        return _deposits[lender];
    }
}
