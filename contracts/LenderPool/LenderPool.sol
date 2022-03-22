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
    mapping(address => uint) private _startTime;
    mapping(address => uint) private _pendingReward;

    IERC20 public immutable stable;
    IERC20 public immutable tStable;

    uint public rewardAPY;

    constructor(address _stableAddress, address _tStableAddress) {
        stable = IERC20(_stableAddress);
        tStable = IERC20(_tStableAddress);
    }

    /**
     * @notice Deposit stable token to smart contract
     * @dev Transfers the approved stable token from msg.sender to lender pool
     * @param amount, the number of stable token to be deposited
     *
     * Requirements:
     *
     * - `amount` should be greater than zero
     * - `amount` must be approved from the stable token contract for the LenderPool contact
     *
     * Emits {Deposit} event
     */
    function deposit(uint amount) external {
        require(amount > 0, "Lending amount invalid");
        uint allowance = stable.allowance(msg.sender, address(this));
        require(allowance >= amount, "Amount not approved");
        _updatePendingReward();
        _deposits[msg.sender] += amount;
        emit Deposit(msg.sender, amount);
        stable.safeTransferFrom(msg.sender, address(this), amount);
    }

    /**
     * @notice converts all the deposited stable token into tStable token and transfers to the lender
     * @dev calculates the tStable token lender can claim and transfers it to the lender
     *
     * Requirements:
     *
     * - `deposit` should be greater than zero
     *
     * Emits {Withdraw} event
     */
    function withdrawAllTStable() external {
        require(_deposits[msg.sender] > 0, "No deposit made");
        _updatePendingReward();
        uint amount = _deposits[msg.sender];
        _deposits[msg.sender] = 0;
        emit Withdraw(msg.sender, amount);
        tStable.safeTransfer(msg.sender, amount);
    }

    /**
     * @notice converts the given amount of stable token into tStable token and transfers to lender
     * @dev checks the required condition and converts stable token to tstable and transfers to lender
     * @param amount, total amount of stable token to be converted to tStable token
     *
     * Requirements:
     *
     * - `deposit` should be greater than tStable amount requested
     *
     * Emits {Withdraw} event
     */
    function withdrawTStable(uint amount) external {
        require(_deposits[msg.sender] >= amount, "Invalid amount requested");
        _updatePendingReward();
        _deposits[msg.sender] -= amount;
        emit Withdraw(msg.sender, amount);
        tStable.safeTransfer(msg.sender, amount);
    }

    function withdrawReward() external {
        _updatePendingReward();
        tStable.safeTransfer(msg.sender, _pendingReward[msg.sender]);
    }

    /**
     *
     *
     */
    function claimRewards() external {
        _updatePendingReward();
        tStable.safeTransfer(msg.sender, _pendingReward[msg.sender]);
        _pendingReward[msg.sender] = 0;
    }

    /**
     *
     */
    function setAPY(uint _rewardAPY) external {
        rewardAPY = _rewardAPY;
    }

    /**
     *
     */
    function getAPY() external view returns (uint) {
        return rewardAPY;
    }

    /**
     * @notice returns amount of stable token deposited by the lender
     * @param lender, address of lender
     * @return returns amount of stable token deposited by the lender
     */
    function getDeposit(address lender) external view returns (uint) {
        return _deposits[lender];
    }

    /**
     *
     *
     */
    function _updatePendingReward() private {
        if (_startTime[msg.sender] != 0) {
            uint totalReward = _calculateReward();
            _pendingReward[msg.sender] += totalReward;
        }
        _startTime[msg.sender] = block.timestamp;
    }

    /**
     *
     */
    function _calculateReward() private view returns (uint) {
        uint interval = block.timestamp - _startTime[msg.sender];
        uint totalReward = ((interval * rewardAPY * _deposits[msg.sender]) /
            365 days);
        return totalReward;
    }
}
