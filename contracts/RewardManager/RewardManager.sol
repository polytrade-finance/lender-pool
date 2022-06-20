//SPDX-License-Identifier: MIT
pragma solidity ^0.8.14;

import "./interface/IRewardManager.sol";
import "../Reward/interface/IReward.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @author Polytrade
 * @title Reward Manager V2
 */
contract RewardManager is IRewardManager, AccessControl {
    IReward public stable;
    IReward public trade;
    address public prevRewardManager;
    bytes32 public constant LENDER_POOL = keccak256("LENDER_POOL");

    uint40 public startTime;

    mapping(address => Lender) private _lender;

    constructor(
        address _stable,
        address _trade,
        address _prevRewardManager
    ) {
        stable = IReward(_stable);
        trade = IReward(_trade);
        prevRewardManager = _prevRewardManager;
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    /**
     * @notice `registerUser` registers the user to the current `RewardManager`
     * @dev It copies the user information from previous `RewardManager`.
     * @param lender, address of the lender
     */
    function registerUser(address lender) external onlyRole(LENDER_POOL) {
        require(startTime > 0, "Not initialized yet");
        require(!_lender[lender].registered, "Already registered");
        require(lender != address(0), "Should not be address(0)");
        if (prevRewardManager != address(0)) {
            uint lenderBalance = IRewardManager(prevRewardManager).getDeposit(
                lender
            );
            if (lenderBalance > 0) {
                _lender[lender].deposit += lenderBalance;
                stable.registerUser(lender, lenderBalance, startTime);
                trade.registerUser(lender, lenderBalance, startTime);
                _lender[lender].registered = true;
            }
        }
    }

    /**
     * @notice `startRewardManager` registers the `RewardManager`
     * @dev It can be called by LENDER_POOL only
     */
    function startRewardManager() external onlyRole(LENDER_POOL) {
        startTime = uint40(block.timestamp);
        emit RewardManagerStarted(startTime);
    }

    /**
     * @notice `increaseDeposit` increases the amount deposited by lender.
     * @dev It calls the `deposit` function of all the rewards in `RewardManager`.
     * @dev It can by only called by `LenderPool`.
     * @param lender, address of the lender
     * @param amount, amount deposited by the lender
     */
    function increaseDeposit(address lender, uint amount)
        external
        onlyRole(LENDER_POOL)
    {
        require(lender != address(0), "Should not be address(0)");

        _lender[lender].deposit += amount;
        trade.deposit(lender, amount);
        stable.deposit(lender, amount);
    }

    /**
     * @notice `withdrawDeposit` decrease the amount deposited by the lender.
     * @dev It calls the `withdraw` function of all the rewards in `RewardManager`
     * @dev It can by only called by `LenderPool`.
     * @param lender, address of the lender
     * @param amount, amount withdrawn by the lender
     */
    function withdrawDeposit(address lender, uint amount)
        external
        onlyRole(LENDER_POOL)
    {
        require(lender != address(0), "Should not be address(0)");

        _lender[lender].deposit -= amount;
        trade.withdraw(lender, amount);
        stable.withdraw(lender, amount);
    }

    /**
     * @notice `claimRewardsFor` claims reward for the lender.
     * @dev All the reward are transferred to the lender.
     * @dev It can by only called by `LenderPool`.
     * @param lender, address of the lender
     */
    function claimAllRewardsFor(address lender) external onlyRole(LENDER_POOL) {
        require(lender != address(0), "Should not be address(0)");

        stable.claimReward(lender);
        trade.claimReward(lender);
    }

    /**
     * @notice `claimRewardFor` transfer all the `token` reward to the `user`
     * @dev It can be called by LENDER_POOL only.
     * @param lender, address of the lender
     * @param token, address of the token
     */
    function claimRewardFor(address lender, address token)
        external
        onlyRole(LENDER_POOL)
    {
        require(lender != address(0), "Should not be address(0)");

        if (stable.getRewardToken() == token) {
            stable.claimReward(lender);
        } else if (trade.getRewardToken() == token) {
            trade.claimReward(lender);
        }
    }

    /**
     * @notice `pauseRewards` sets the reward for all the tokens to 0
     */
    function pauseReward() external onlyRole(LENDER_POOL) {
        stable.pauseReward();
        trade.pauseReward();
    }

    /**
     * @notice `rewardOf` returns array of reward for the lender
     * @dev It returns array of number, where each element is a reward
     * @dev For example - [stable reward, trade reward 1, trade reward 2]
     */
    function rewardOf(address lender, address token)
        external
        view
        returns (uint)
    {
        if (stable.getRewardToken() == token) {
            return stable.rewardOf(lender);
        } else if (trade.getRewardToken() == token) {
            return trade.rewardOf(lender);
        } else {
            return 0;
        }
    }

    /**
     * @notice `getDeposit` returns the total amount deposited by the lender
     * @dev If this RewardManager is not the current and user has registered then this value will not be updated
     * @param lender, address of the lender
     * @return total amount deposited by the lender
     */
    function getDeposit(address lender) external view returns (uint) {
        return _lender[lender].deposit;
    }
}
