//SPDX-License-Identifier: MIT
pragma solidity ^0.8.14;

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

    mapping(address => Lender) private _lender;
    mapping(address => uint) public managerToIndex;

    address[] public managerList;

    IToken public immutable stable;
    IToken public immutable tStable;
    IRedeemPool public immutable redeemPool;
    IStrategy public strategy;
    IVerification public verification;
    IRewardManager public rewardManager;
    address public treasury;

    uint public currManager = 0;

    constructor(
        address _stableAddress,
        address _tStableAddress,
        address _redeemPool,
        address _treasuryAddress
    ) {
        stable = IToken(_stableAddress);
        tStable = IToken(_tStableAddress);
        redeemPool = IRedeemPool(_redeemPool);
        treasury = _treasuryAddress;
        managerList.push(address(0));
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
        require(newStrategy != address(0));
        address oldStrategy = address(strategy);
        if (oldStrategy != address(0)) {
            uint amount = strategy.getBalance();
            strategy.withdraw(amount);
            strategy = Strategy(newStrategy);
            _depositInStrategy(amount);
        }
        strategy = Strategy(newStrategy);
        emit StrategySwitched(oldStrategy, newStrategy);
    }

    /**
     * @notice `switchRewardManager` is used to switch reward manager.
     * @dev It pauses reward for previous `RewardManager` and initializes new `RewardManager` .
     * @dev It can be called by only owner of LenderPool.
     * @dev Changed `RewardManager` contract must complies with `IRewardManager`.
     * @param newRewardManager, Address of the new `RewardManager`.
     *
     * Emits {RewardManagerSwitched} event
     */
    function switchRewardManager(address newRewardManager) external onlyOwner {
        require(newRewardManager != address(0));
        address oldRewardManager = address(rewardManager);
        if (oldRewardManager != address(0)) {
            rewardManager.pauseReward();
        }
        rewardManager = IRewardManager(newRewardManager);
        rewardManager.registerRewardManager();
        currManager += 1;
        managerToIndex[newRewardManager] = currManager;
        managerList.push(newRewardManager);
        emit RewardManagerSwitched(oldRewardManager, newRewardManager);
    }

    /**
     * @notice `switchVerification` updates the Verification contract address.
     * @dev Changed verification Contract must complies with `IVerification`
     * @param newVerification, address of the new Verification contract
     *
     * Emits {VerificationContractUpdated} event
     */
    function switchVerification(address newVerification) external onlyOwner {
        require(newVerification != address(0));
        address oldVerification = address(verification);
        verification = IVerification(newVerification);
        emit VerificationSwitched(oldVerification, newVerification);
    }

    /**
     * @notice `switchTreasury` updates the Treasury contract address.
     * @dev Changed treasury Contract must complies with `ITreasury`
     * @param newTreasury, address of the new Treasury contract
     *
     * Emits {TreasuryContractUpdated} event
     */
    function switchTreasury(address newTreasury) external onlyOwner {
        require(newTreasury != address(0));
        address oldTreasury = address(treasury);
        stable.approve(oldTreasury, 0);
        treasury = newTreasury;
        emit TreasurySwitched(oldTreasury, newTreasury);
    }

    /**
     * @notice `deposit` is used by lenders to deposit stable token to the LenderPool.
     * @dev It transfers the approved stable token from msg.sender to the LenderPool.
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
        _isUserRegistered(msg.sender);
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

        rewardManager.increaseDeposit(msg.sender, amount);
        _lender[msg.sender].deposit += amount;
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
        _isUserRegistered(msg.sender);
        uint balance = _lender[msg.sender].deposit;
        require(balance > 0, "No amount deposited");
        rewardManager.withdrawDeposit(msg.sender, _lender[msg.sender].deposit);
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
        _isUserRegistered(msg.sender);
        require(amount > 0, "amount must be positive integer");
        uint balance = _lender[msg.sender].deposit;
        require(balance >= amount, "amount request more than deposit");
        rewardManager.withdrawDeposit(msg.sender, amount);
        _lender[msg.sender].deposit -= amount;
        tStable.mint(msg.sender, amount);
        emit Withdraw(msg.sender, amount);
    }

    /**
     * @notice `claimRewards` transfers lender all the reward of the current manager.
     * @dev It calls `claimRewardsFor` from `RewardManager`.
     * @dev RewardManager may be changed by LenderPool's owner.
     */
    function claimAllRewards() external {
        _isUserRegistered(msg.sender);
        for (uint i = 1; i <= currManager; i++) {
            IRewardManager __rewardManager = IRewardManager(managerList[i]);
            __rewardManager.claimAllRewardsFor(msg.sender);
        }
    }

    /**
     * @notice `claimReward` transfer all the `token` reward to `msg.sender`
     * @dev It loops through all the `RewardManager` and transfer `token` reward.
     * @param token, address of the token
     */
    function claimReward(address token) external {
        _isUserRegistered(msg.sender);
        for (uint i = 1; i <= currManager; i++) {
            IRewardManager __rewardManager = IRewardManager(managerList[i]);
            __rewardManager.claimRewardFor(msg.sender, token);
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
        _isUserRegistered(msg.sender);
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
        rewardManager.claimAllRewardsFor(msg.sender);
    }

    function fillRedeemPool(uint amount) external onlyOwner {
        require(amount > 0, "Amount can not be zero");
        _withdrawFromStrategy(amount);
        stable.transfer(address(redeemPool), amount);
    }

    /**
     * @notice Registers user to all the reward manager
     * @dev User have to register to RewardManager before interacting with RewardManager
     */
    function registerUser() external {
        for (uint i = 1; i <= currManager; i++) {
            if (!_lender[msg.sender].isRegistered[managerList[i]]) {
                IRewardManager manager = IRewardManager(managerList[i]);
                manager.registerUser(msg.sender);
                _lender[msg.sender].isRegistered[managerList[i]] = true;
            }
        }
    }

    /**
     * @notice `rewardOf` returns the total reward of the lender
     * @dev It returns array of number, where each element is a reward
     * @dev For example - [stable reward, trade reward 1, trade reward 2]
     * @return Returns the total pending reward
     */
    function rewardOf(address lender, address token)
        external
        view
        returns (uint)
    {
        _isUserRegistered(lender);
        uint totalReward = 0;
        for (uint i = 1; i <= currManager; i++) {
            IRewardManager manager = IRewardManager(managerList[i]);
            totalReward += manager.rewardOf(lender, token);
        }
        return totalReward;
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
     * @notice `_depositInStrategy` deposits stable token to external protocol.
     * @dev Funds will be deposited to a Strategy (external protocols) like Aave, compound
     * @param amount, total amount to be deposited.
     */
    function _depositInStrategy(uint amount) private {
        stable.approve(address(strategy), amount);
        strategy.deposit(amount);
    }

    /**
     * @notice `_withdrawFromStrategy`  withdraws all funds from external protocol.
     * @dev It transfers all funds from external protocol to `LenderPool`.
     * @dev It can be called by only owner of LenderPool.
     * @param amount, total amount to be withdrawn from staking strategy.
     *
     * Requirements:
     * - Total amount in external protocol should be less than `amount` requested.
     *
     */
    function _withdrawFromStrategy(uint amount) private onlyOwner {
        require(
            _getStrategyBalance() >= amount,
            "Balance less than requested."
        );
        strategy.withdraw(amount);
    }

    /**
     * @notice `_isUserRegistered` checks if user is registered in the current RewardManager
     * @param _user, address of the user
     */
    function _isUserRegistered(address _user) private view {
        require(
            address(rewardManager) == address(0) ||
                managerToIndex[address(rewardManager)] != 0,
            "Invalid RewardManager"
        );
        if (address(rewardManager) != address(0)) {
            require(
                managerList[managerToIndex[address(rewardManager)] - 1] ==
                    address(0) ||
                    (_lender[_user].isRegistered[
                        managerList[managerToIndex[address(rewardManager)] - 1]
                    ] && _lender[_user].isRegistered[address(rewardManager)]),
                "Please Register to RewardManager"
            );
        }
    }
}
