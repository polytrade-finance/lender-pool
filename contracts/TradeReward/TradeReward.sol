//SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "./interface/ITradeReward.sol";

contract TradeReward is ITradeReward, AccessControl {
    bytes32 public constant LENDER_POOL = keccak256("LENDER_POOL");
    bytes32 public constant OWNER = keccak256("OWNER");

    mapping(address => Lender) private _lender;
    mapping(uint16 => RoundInfo) public round;

    uint16 public currentRound = 0;

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    function setTradeRate(uint16 tradeRate) external onlyRole(OWNER) {
        if (currentRound > 0) {
            round[currentRound].endTime = uint40(block.timestamp);
        }
        currentRound += 1;
        round[currentRound] = RoundInfo(
            tradeRate,
            uint40(block.timestamp),
            type(uint40).max
        );
    }

    function deposit(address lender, uint amount)
        external
        onlyRole(LENDER_POOL)
    {
        require(amount > 0, "Lending amount is 0");
        if (_lender[lender].startPeriod > 0) {
            _updatePendingReward(lender);
        } else {
            _lender[lender].startPeriod = uint40(block.timestamp);
        }

        _lender[lender].deposit += amount;
        _lender[lender].round = currentRound;
    }

    function withdraw(address lender, uint amount)
        external
        onlyRole(LENDER_POOL)
    {
        require(amount > 0, "Cannot withdraw 0 amount");
        require(_lender[lender].deposit >= amount, "Invalid amount requested");
        if (currentRound > 0) {
            _updatePendingReward(lender);
        }
        _lender[lender].deposit -= amount;
    }

    function rewardOf(address lender) external view returns (uint) {
        if (_lender[lender].round < currentRound) {
            return
                _lender[lender].pendingRewards +
                _calculateFromPreviousRounds(lender);
        } else {
            return
                _lender[lender].pendingRewards + _calculateCurrentRound(lender);
        }
    }

    function claimReward(address lender, uint amount)
        external
        onlyRole(LENDER_POOL)
    {
        _updatePendingReward(lender);
        _lender[lender].pendingRewards -= amount;
    }

    function _updatePendingReward(address lender) private {
        if (_lender[lender].round == currentRound) {
            _lender[lender].pendingRewards += _calculateCurrentRound(lender);
        }

        if (_lender[lender].round < currentRound) {
            _lender[lender].pendingRewards += _calculateFromPreviousRounds(
                lender
            );
            _lender[lender].round = currentRound;
        }
        _lender[lender].startPeriod = uint40(block.timestamp);
    }

    function _calculateCurrentRound(address lender)
        private
        view
        returns (uint)
    {
        uint reward = _calculateReward(
            _lender[lender].deposit,
            _max(_lender[lender].startPeriod, round[currentRound].startTime),
            _min(uint40(block.timestamp), round[currentRound].endTime),
            round[currentRound].tradeRate
        );
        return reward;
    }

    function _calculateFromPreviousRounds(address lender)
        private
        view
        returns (uint)
    {
        uint reward = 0;
        for (uint16 i = _lender[lender].round; i <= currentRound; i++) {
            if (i == 0) {
                continue;
            }

            reward += _calculateReward(
                _lender[lender].deposit,
                _max(_lender[lender].startPeriod, round[i].startTime),
                _min(uint40(block.timestamp), round[i].endTime),
                round[i].tradeRate
            );
        }
        return reward;
    }

    /**
     * @notice calculates the reward
     * @dev calculates the reward using simple interest formula
     * @param amount, principal amount
     * @param start, start of the tenure for reward
     * @param end, end of the tenure for reward
     * @param tradeRate, Annual percentage yield received during the tenure
     * @return returns reward
     */
    function _calculateReward(
        uint amount,
        uint40 start,
        uint40 end,
        uint16 tradeRate
    ) private pure returns (uint) {
        uint oneYear = (100 * 365 days);
        return (((end - start) * tradeRate * amount) / oneYear);
    }

    /**
     * @notice returns maximum among two uint40 variables
     * @dev compares two uint40 variables a and b and return maximum between them
     * @param a, value of uint40 variable
     * @param b, value of uint40 variable
     * @return returns maximum between a and b
     */
    function _max(uint40 a, uint40 b) private pure returns (uint40) {
        return a > b ? a : b;
    }

    /**
     * @notice returns minimum among two uint40 variables
     * @dev compares two uint40 variables a and b and return minimum between them
     * @param a, value of uint40 variable
     * @param b, value of uint40 variable
     * @return returns minimum between a and b
     */
    function _min(uint40 a, uint40 b) private pure returns (uint40) {
        return a > b ? b : a;
    }
}
