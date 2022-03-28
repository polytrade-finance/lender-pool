//SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./interface/ILenderPool.sol";

/**
 * @author Polytrade
 * @title LenderPool V2
 */
contract LenderPool is ILenderPool, Ownable {
    using SafeERC20 for IERC20;

    mapping(address => uint) private _deposits;
    mapping(address => uint40) private _startTime;
    mapping(address => uint) private _pendingReward;

    IERC20 public immutable stable;
    IERC20 public immutable tStable;

    uint16 public rewardAPY;

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
        require(amount > 0, "Lending amount is 0");
        uint allowance = stable.allowance(msg.sender, address(this));
        require(allowance >= amount, "Not enough allowance");

        _updatePendingReward(msg.sender);
        _deposits[msg.sender] += amount;
        emit Deposit(msg.sender, amount);
        stable.safeTransferFrom(msg.sender, address(this), amount);
    }

    /**
     * @notice converts all the deposited stable token into tStable token and transfers to the lender
     * @dev calculates the tStable token lender can claim and transfers it to the lender
     */
    function withdrawAllTStable() external {
        _withdraw(_deposits[msg.sender]);
    }

    /**
     * @notice converts the given amount of stable token into tStable token and transfers to lender
     * @dev checks the required condition and converts stable token to tStable and transfers to lender
     * @param amount, total amount of stable token to be converted to tStable token
     */
    function withdrawTStable(uint amount) external {
        _withdraw(amount);
    }

    /**
     * @notice transfer lender all the reward
     * @dev update the pendingReward and transfers reward in tStable token to lender
     *
     * Requirements:
     *
     * - `_pendingReward` should be greater than 0
     *
     * Emits {Withdraw} event
     */
    function claimRewards() external {
        _updatePendingReward(msg.sender);
        require(_pendingReward[msg.sender] > 0, "No pending reward");

        emit Withdraw(msg.sender, _pendingReward[msg.sender]);

        tStable.safeTransfer(msg.sender, _pendingReward[msg.sender]);
        _pendingReward[msg.sender] = 0;
    }

    /**
     * @notice set the value of rewardAPY
     * @dev set the value of rewardAPY to _rewardAPY, only owner can call
     * @param _rewardAPY, new value of new rewardAPY
     *
     * Emits {NewRewardAPY} event
     */
    function setAPY(uint16 _rewardAPY) external onlyOwner {
        rewardAPY = _rewardAPY;
        emit NewRewardAPY(rewardAPY);
    }

    /**
     * @notice returns value of rewardAPY
     * @return returns value of rewardAPY
     */
    function getAPY() external view returns (uint16) {
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
     * @notice returns the total pending reward
     * @dev returns the total pending reward of msg.sender
     * @return returns the total pending reward
     */
    function rewardOf(address lender) external view returns (uint) {
        return
            _calculateReward(_startTime[lender], _deposits[lender]) +
            _pendingReward[lender];
    }

    /**
     * @notice converts the deposited stable token of quantity `amount` into tStable token and transfers to the lender
     * @param amount, to be transferred to the msg.sender
     *
     * Requirements:
     *
     * - deposited amount must be greater than amount requested
     * - `amount` should be greater than zero
     *
     * Emits {Withdraw} event
     */
    function _withdraw(uint amount) private {
        require(amount > 0, "Cannot withdraw 0 amount");
        require(_deposits[msg.sender] >= amount, "Invalid amount requested");

        _updatePendingReward(msg.sender);

        _deposits[msg.sender] -= amount;
        emit Withdraw(msg.sender, amount);
        tStable.safeTransfer(msg.sender, amount);
    }

    /**
     * @notice updates the _pendingReward and _startTime mapping
     * @dev stores all the reward received till now in _pendingRewards and set _startTime to current block timestamp
     *
     * Requirements:
     *
     * - `_startTime` should not be 0
     *
     */
    function _updatePendingReward(address lender) private {
        uint startTime = _startTime[lender];
        if (startTime > 0) {
            _pendingReward[lender] += _calculateReward(
                startTime,
                _deposits[lender]
            );
        }
        _startTime[lender] = uint40(block.timestamp);
    }

    /**
     * @notice calculates the total reward
     * @dev calculates the total reward using simple interest formula
     * @return returns total reward
     */
    function _calculateReward(uint startTime, uint lenderDeposit)
        private
        view
        returns (uint)
    {
        uint interval = block.timestamp - startTime;
        uint oneYear = (10000 * 365 days);
        return ((interval * rewardAPY * lenderDeposit) / oneYear);
    }
}
