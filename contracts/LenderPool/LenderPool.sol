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

    mapping(address => Lender) private _lender;
    mapping(uint16 => RoundInfo) public round;

    IERC20 public immutable stable;
    IERC20 public immutable tStable;

    uint16 public currentRound = 0;

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
        if (_lender[msg.sender].startPeriod > 0) {
            _updatePendingReward(msg.sender);
        }
        _lender[msg.sender].deposit += amount;
        _lender[msg.sender].round = currentRound;
        emit Deposit(msg.sender, amount);
        stable.safeTransferFrom(msg.sender, address(this), amount);
    }

    /**
     * @notice converts all the deposited stable token into tStable token and transfers to the lender
     * @dev calculates the tStable token lender can claim and transfers it to the lender
     */
    function withdrawAllTStable() external {
        _withdraw(_lender[msg.sender].deposit);
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
     * Emits {Withdraw} event
     */
    function claimRewards() external {
        _updatePendingReward(msg.sender);
        uint totalReward = _lender[msg.sender].pendingRewards;
        _lender[msg.sender].pendingRewards = 0;
        emit Withdraw(msg.sender, totalReward);
        tStable.safeTransfer(msg.sender, totalReward);
    }

    /**
     * @notice adds a new round
     * @dev increment currentRound and adds a new round, only owner can call
     * @param _rewardAPY, new value of new round.apy
     *
     * Emits {NewRewardAPY} event
     */
    function setAPY(uint16 _rewardAPY) external onlyOwner {
        if (currentRound > 0) {
            round[currentRound].endTime = uint40(block.timestamp);
        }
        currentRound += 1;
        round[currentRound] = RoundInfo(
            _rewardAPY,
            uint40(block.timestamp),
            type(uint40).max
        );
        emit NewRewardAPY(round[currentRound].apy);
    }

    /**
     * @notice returns value of APY of current round
     * @return returns value of APY of current round
     */
    function getAPY() external view returns (uint16) {
        return round[currentRound].apy;
    }

    /**
     * @notice returns amount of stable token deposited by the lender
     * @param lender, address of lender
     * @return returns amount of stable token deposited by the lender
     */
    function getDeposit(address lender) external view returns (uint) {
        return _lender[lender].deposit;
    }

    /**
     * @notice returns the total pending reward
     * @dev returns the total pending reward of msg.sender
     * @return returns the total pending reward
     */
    function rewardOf(address lender) external view returns (uint) {
        if (_lender[lender].round == currentRound) {
            return
                _lender[lender].pendingRewards + _calculateRewardCase1(lender);
        } else if (_lender[lender].round < currentRound) {
            return
                _calculateRewardCase2(lender) + _lender[lender].pendingRewards;
        } else {
            return 0;
        }
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
        require(
            _lender[msg.sender].deposit >= amount,
            "Invalid amount requested"
        );
        if (currentRound > 0) {
            _updatePendingReward(msg.sender);
        }
        _lender[msg.sender].deposit -= amount;
        emit Withdraw(msg.sender, amount);
        tStable.safeTransfer(msg.sender, amount);
    }

    /**
     * @notice updates round, pendingRewards and startTime of the lender
     * @dev compares the lender round with currentRound and updates _lender accordingly
     * @param lender, address of the lender
     */
    function _updatePendingReward(address lender) private {
        if (_lender[lender].round == currentRound) {
            _lender[lender].pendingRewards += _calculateRewardCase1(lender);
        }

        if (_lender[lender].round < currentRound) {
            _lender[lender].pendingRewards += _calculateRewardCase2(lender);
            _lender[lender].round = currentRound;
        }
        _lender[lender].startPeriod = uint40(block.timestamp);
    }

    function _calculateRewardCase1(address lender) private view returns (uint) {
        uint reward = _calculateReward(
            _lender[lender].deposit,
            _max(_lender[lender].startPeriod, round[currentRound].startTime),
            _min(uint40(block.timestamp), round[currentRound].endTime),
            round[currentRound].apy
        );
        return reward;
    }

    function _calculateRewardCase2(address lender) private view returns (uint) {
        uint reward = 0;
        for (uint16 i = _lender[lender].round; i <= currentRound; i++) {
            if (i == 0) {
                continue;
            }

            reward += _calculateReward(
                _lender[lender].deposit,
                _max(_lender[lender].startPeriod, round[i].startTime),
                _min(uint40(block.timestamp), round[i].endTime),
                round[i].apy
            );
        }
        return reward;
    }

    /**
     * @notice calculates the total reward
     * @dev calculates the total reward using simple interest formula
     * @param amount, principal amount
     * @param start, start of the tenure for reward
     * @param end, end of the tenure for reward
     * @param apy, Annual percentage yield received during the tenure
     * @return returns total reward
     */
    function _calculateReward(
        uint amount,
        uint40 start,
        uint40 end,
        uint16 apy
    ) private pure returns (uint) {
        if (start >= end) {
            return 0;
        }
        uint oneYear = (10000 * 365 days);
        return (((end - start) * apy * amount) / oneYear);
    }

    /**
     * @notice returns maximum among two uint40 variables
     * @dev compares two uint40 variables a and b and return maximum between them
     * @param a, value of uint40 variable
     * @param b, value of uint40 variable
     * @return maximum between a and b
     */
    function _max(uint40 a, uint40 b) private pure returns (uint40) {
        return a > b ? a : b;
    }

    /**
     * @notice returns minimum among two uint40 variables
     * @dev compares two uint40 variables a and b and return minimum between them
     * @param a, value of uint40 variable
     * @param b, value of uint40 variable
     * @return minimum between a and b
     */
    function _min(uint40 a, uint40 b) private pure returns (uint40) {
        return a > b ? b : a;
    }
}
