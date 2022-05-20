//SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "../Strategy/Strategy.sol";
import "./interface/ILenderPool.sol";
import "../Token/interface/IToken.sol";
import "../RedeemPool/interface/IRedeemPool.sol";
import "../Verification/interface/IVerification.sol";
import "../RewardManager/interface/IRewardManager.sol";

/**
 * @author Polytrade
 * @title LenderPool V2
 */
contract LenderPool is ILenderPool, Ownable {
    using SafeERC20 for IToken;

    mapping(address => Lender) private _lender;
    mapping(address => bool) public isRewardManager;

    IToken public immutable stable;
    IToken public immutable tStable;
    IRedeemPool public immutable redeemPool;
    IStrategy public strategy;
    IVerification public verification;
    IRewardManager public rewardManager;

    constructor(
        address _stableAddress,
        address _tStableAddress,
        address _redeemPool
    ) {
        stable = IToken(_stableAddress);
        tStable = IToken(_tStableAddress);
        redeemPool = IRedeemPool(_redeemPool);
    }

    /**
     * @notice `deposit` is used by lenders to depsoit stable token to smart contract.
     * @dev It transfers the approved stable token from msg.sender to lender pool.
     * @param amount, The number of stable token to be deposited.
     *
     * Requirements:
     *
     * - `amount` should be greater than zero.
     * - `amount` must be approved from the stable token contract for the LenderPool.
     * - `amount` should be less than validation limit or KYC needs to be completed.
     *
     * Emits {Deposit} event
     */
    function deposit(uint amount) external {
        require(amount > 0, "Amount must be positive integer");
        uint allowance = stable.allowance(msg.sender, address(this));
        require(allowance >= amount, "Not enough allowance");

        require(
            !(
                verification.isValidationRequired(
                    _lender[msg.sender].deposit + amount
                )
            ) || verification.isValid(msg.sender),
            "Need to have valid KYC"
        );

        stable.safeTransferFrom(msg.sender, address(this), amount);
        _depositInStrategy(amount);

        if (_lender[msg.sender].deposit != 0) {
            _registerUser(msg.sender);
        }
        rewardManager.increaseDeposit(msg.sender, amount);
        _lender[msg.sender].deposit += amount;
        _lender[msg.sender].time = uint40(block.timestamp);
        emit Deposit(msg.sender, amount);
    }

    /**
     * @notice `withdrawAllDeposit` send lender tStable equivalent to stable deposited.
     * @dev It mints tStable and sends to lender.
     * @dev It sets the amount deposited by lender to zero.
     *
     * Emits {Withdraw} event
     */
    function withdrawAllDeposit() external {
        uint balance = _lender[msg.sender].deposit;
        require(balance > 0, "No amount deposited");
        _registerUser(msg.sender);
        rewardManager.withdrawDeposit(msg.sender, _lender[msg.sender].deposit);
        _lender[msg.sender].time = uint40(block.timestamp);
        _lender[msg.sender].deposit = 0;
        tStable.mint(msg.sender, balance);
        emit Withdraw(msg.sender, balance);
    }

    /**
     * @notice `withdrawDeposit` send lender tStable equivalent to stable requested.
     * @dev It mints tStable and sends to lender.
     * @dev It decreases the amount deposited by lender.
     * @param amount, Total token requested by lender.
     *
     * Requirements:
     * - `amount` should be greater than 0.
     * - `amount` should be not greater than deposited.
     *
     * Emits {Withdraw} event
     */
    function withdrawDeposit(uint amount) external {
        require(amount > 0, "amount must be positive integer");
        uint balance = _lender[msg.sender].deposit;
        require(balance >= amount, "amount request more than deposit");
        _registerUser(msg.sender);
        rewardManager.withdrawDeposit(msg.sender, amount);
        _lender[msg.sender].time = uint40(block.timestamp);
        _lender[msg.sender].deposit -= amount;
        tStable.mint(msg.sender, amount);
        emit Withdraw(msg.sender, amount);
    }

    /**
     * @notice `claimRewards` transfers lender all the reward.
     * @dev It calls `claimRewardsFor` from `RewardManager`.
     * @dev RewardManager may be changed by LenderPool's owner.
     * @dev User can obtain reward from old `RewardManager` by calling `claimRewards` function.
     */
    function claimRewards() external {
        _registerUser(msg.sender);
        rewardManager.claimRewardsFor(msg.sender);
    }

    function claimPreviousRewards(address _rewardManager) external {
        if (isRewardManager[_rewardManager]) {
            _registerUser(msg.sender);
            rewardManager.claimRewardsFor(msg.sender);
        }
    }

    /**
     * @notice `redeemAll` call transfers all reward and deposited amount in stable token.
     * @dev It converts the tStable to stable using `RedeemPool`.
     * @dev It calls `claimRewardsFor` from `RewardManager`.
     *
     * Requirements :
     * - `RedeemPool` should have stable tokens more than lender deposited.
     *
     */
    function redeemAll() external {
        uint balance = _lender[msg.sender].deposit;
        require(
            stable.balanceOf(address(redeemPool)) >= balance,
            "Insufficient balance in pool"
        );
        if (balance > 0) {
            rewardManager.withdrawDeposit(
                msg.sender,
                _lender[msg.sender].deposit
            );
        }
        _lender[msg.sender].deposit = 0;
        tStable.mint(address(this), balance);
        tStable.approve(address(redeemPool), balance);
        redeemPool.redeemStableFor(msg.sender, balance);
        _registerUser(msg.sender);
        rewardManager.claimRewardsFor(msg.sender);
    }

    /**
     * @notice `switchRewardManager` is used to switch reward manager.
     * @dev It pauses reward for previous `RewardManager` and initializes new `RewardManager` .
     * @dev It can be called by only owner of LenderPool.
     * @dev Changed `RewardManager` contract must complies with `IRewardManager`.
     * @param newRewardManager, Addess of the new `RewardManager`.
     *
     * Emits {RewardManagerSwitched} event
     */
    function switchRewardManager(address newRewardManager) external onlyOwner {
        address oldRewardManager = address(rewardManager);
        if (oldRewardManager != address(0)) {
            rewardManager.pauseReward();
        }
        rewardManager = IRewardManager(newRewardManager);
        rewardManager.registerRewardManager();
        isRewardManager[newRewardManager] = true;
        emit RewardManagerSwitched(oldRewardManager, newRewardManager);
    }

    /**
     * @notice `switchStrategy` is used for switching the strategy.
     * @dev It moves all the funds from the old strategy to the new strategy.
     * @dev It can be called by only owner of LenderPool.
     * @dev Changed strategy contract must complies with `IStrategy`.
     * @param newStrategy, address of the new staking strategy.
     *
     * Emits {StrategySwitched} event
     */
    function switchStrategy(address newStrategy) external onlyOwner {
        address oldStrategy = address(strategy);
        if (oldStrategy != address(0)) {
            uint amount = _getStrategyBalance();
            _withdrawAllFromStrategy();
            strategy = Strategy(newStrategy);
            _depositInStrategy(amount);
        }
        strategy = Strategy(newStrategy);
        emit StrategySwitched(oldStrategy, newStrategy);
    }

    /**
     * @notice `switchVerification` updates the Verification contract address.
     * @dev Changed verification Contract must complies with `IVerification`
     * @param newVerification, address of the new Verification contract
     *
     * Emits {VerificationContractUpdated} event
     */
    function switchVerification(address newVerification) external onlyOwner {
        address oldVerification = address(verification);
        verification = IVerification(newVerification);
        emit VerificationSwitched(oldVerification, newVerification);
    }

    /**
     * @notice `rewardOf` returns the total reward of the lender
     * @dev It returns array of number, where each element is a reward
     * @dev For example - [stable reward, trade reward 1, trade reward 2]
     * @return Returns the total pending reward
     */
    function rewardOf(address lender) external returns (uint[] memory) {
        if (_lender[lender].deposit != 0) {
            _registerUser(lender);
        }
        return rewardManager.rewardOf(lender);
    }

    /**
     * @notice `getDeposit` returns total amount deposited by the lender
     * @param lender, address of the lender
     * @return returns amount of stable token deposited by the lender
     */
    function getDeposit(address lender) external view returns (uint) {
        return _lender[lender].deposit;
    }

    /**
     * @notice `getStrategyBalance` Reurns total balance of lender in external protocol
     * @return Reurns total balance of lender in external protocol
     */
    function getStrategyBalance() external view onlyOwner returns (uint) {
        return _getStrategyBalance();
    }

    /**
     * @notice `withdrawFromStrategy`  withdraws all funds from external protocol.
     * @dev It transfers all funds from external protocol to `LenderPool`.
     * @dev It can be called by only owner of LenderPool.
     * @param amount, total amount to be withdrawn from staking strategy.
     *
     * Requirements:
     * - Total amount in external protcol should be less than `amount` requested.
     *
     */
    function withdrawFromStrategy(uint amount) public onlyOwner {
        require(
            _getStrategyBalance() >= amount,
            "Balance less than requested."
        );
        strategy.withdraw(amount);
    }

    /**
     * @notice `depositInStrategy` deposits funds in strategy.
     * @dev Funds will be deposited to external protocol like aave, compund
     * @dev It transfers token from `LenderPool` to external protocol.
     * @dev It can be called by only owner of LenderPool.
     * @param amount, amount to be deposited in strategy.
     */
    function depositInStrategy(uint amount) public onlyOwner {
        stable.approve(address(strategy), amount);
        strategy.deposit(amount);
    }

    /**
     * @notice `_depositInStrategydeposit` deposits stable token to external protocol.
     * @dev Funds will be deposited to external protocol like aave, compund
     * @param amount, total amount to be deposited.
     */
    function _depositInStrategy(uint amount) private {
        stable.approve(address(strategy), amount);
        strategy.deposit(amount);
    }

    function _registerUser(address lender) private {
        rewardManager.registerUser(
            lender,
            _lender[lender].deposit,
            _lender[lender].time
        );
    }

    /**
     * @notice `_withdrawAllFromStrategy` withdraws all funds from external protocol.
     * @dev It transfers all funds from external protocol to `LenderPool`.
     * @dev It can be called by only owner of LenderPool.
     */
    function _withdrawAllFromStrategy() private onlyOwner {
        uint amount = _getStrategyBalance();
        strategy.withdraw(amount);
    }

    /**
     * @notice `_getStrategyBalance` Reurns total balance of lender in external protocol
     * @return Reurns total balance of lender in external protocol
     */
    function _getStrategyBalance() private view returns (uint) {
        return strategy.getBalance();
    }
}
