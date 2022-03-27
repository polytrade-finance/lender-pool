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
    mapping(address => uint) private _startTime;
    mapping(address => uint) private _pendingReward;

    IERC20 public immutable stable;
    IERC20 public immutable tStable;

    ApyInfo[] public apyList;

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
        _updatePendingReward(msg.sender);
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
        _updatePendingReward(msg.sender);
        uint amount = _deposits[msg.sender];
        _deposits[msg.sender] = 0;
        emit Withdraw(msg.sender, amount);
        tStable.safeTransfer(msg.sender, amount);
    }

    /**
     * @notice converts the given amount of stable token into tStable token and transfers to lender
     * @dev checks the required condition and converts stable token to tStable and transfers to lender
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
        _updatePendingReward(msg.sender);
        _deposits[msg.sender] -= amount;
        emit Withdraw(msg.sender, amount);
        tStable.safeTransfer(msg.sender, amount);
    }

    /**
     * @notice it transfer to the lender all its rewards
     * @dev update the pendingReward and transfers reward in tStable token to the lender
     *
     * Requirements:
     *
     * - `_pendingReward` should be greater than 0
     *
     * Emits {Withdraw} event
     */
    function withdrawReward() external {
        _updatePendingReward(msg.sender);
        require(_pendingReward[msg.sender] > 0, "No pending reward");
        emit Withdraw(msg.sender, _pendingReward[msg.sender]);
        uint totalReward = _pendingReward[msg.sender];
        _pendingReward[msg.sender] = 0;
        tStable.safeTransfer(msg.sender, totalReward);
    }

    /**
     * @notice set the value of rewardAPY
     * @dev set the value of rewardAPY to _rewardAPY, only owner can call
     * @param _rewardAPY, new value of new rewardAPY
     *
     * Emits {NewRewardAPY} event
     */
    function setAPY(uint _rewardAPY) external onlyOwner {
        if (apyList.length != 0) {
            apyList[apyList.length - 1].endTime = block.timestamp;
        }
        apyList.push(ApyInfo(_rewardAPY, block.timestamp, type(uint).max));
        emit NewRewardAPY(_rewardAPY);
    }

    /**
     * @notice returns value of rewardAPY
     * @return returns value of rewardAPY
     */
    function getLatestAPY() external view returns (uint) {
        return apyList[apyList.length - 1].apyValue;
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
     * @notice returns the total pending reward of the lender
     * @dev returns the total pending reward of the lender
     * @param lender, address of the lender
     * @return returns the total pending reward
     */
    function rewardOf(address lender) external view returns (uint) {
        return _calculateReward(lender) + _pendingReward[lender];
    }

    /**
     * @notice updates the _pendingReward and _startTime mapping of the lender
     * @dev stores all the reward received till now in _pendingRewards and set _startTime to current block timestamp
     * @param lender, address of the lender
     *
     * Requirements:
     *
     * - `_startTime` should be greater than 0
     *
     */
    function _updatePendingReward(address lender) private {
        if (_startTime[lender] > 0) {
            uint totalReward = _calculateReward(lender);
            _pendingReward[lender] += totalReward;
        }
        _startTime[lender] = block.timestamp;
    }

    /**
     * @notice calculates the total reward of the lender
     * @dev loops through apyList to calculate the total reward of the lender
     * @param lender, address of the lender
     * @return returns total reward
     */
    function _calculateReward(address lender) private view returns (uint) {
        uint reward = 0;
        for (uint i = 0; i < apyList.length; i++) {
            if (
                _startTime[lender] <= apyList[i].startTime &&
                block.timestamp >= apyList[i].startTime &&
                block.timestamp <= apyList[i].endTime
            ) {
                reward += (((block.timestamp - apyList[i].startTime) *
                    apyList[i].apyValue *
                    _deposits[lender]) / (100 * 365 days));
            } else if (
                _startTime[lender] <= apyList[i].startTime &&
                block.timestamp >= apyList[i].endTime
            ) {
                reward += (((apyList[i].endTime - apyList[i].startTime) *
                    apyList[i].apyValue *
                    _deposits[lender]) / (100 * 365 days));
            } else if (
                _startTime[lender] >= apyList[i].startTime &&
                _startTime[lender] <= apyList[i].endTime &&
                block.timestamp >= apyList[i].endTime
            ) {
                reward += (((apyList[i].endTime - _startTime[lender]) *
                    apyList[i].apyValue *
                    _deposits[lender]) / (100 * 365 days));
            } else if (
                _startTime[lender] >= apyList[i].startTime &&
                block.timestamp <= apyList[i].endTime
            ) {
                reward += (((block.timestamp - _startTime[lender]) *
                    apyList[i].apyValue *
                    _deposits[lender]) / (100 * 365 days));
            }
        }
        return reward;
    }
}
