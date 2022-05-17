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

    function switchRewardManager(address newRewardManager) external onlyOwner {
        address oldrewardManager = address(rewardManager);
        rewardManager = IRewardManager(newRewardManager);
        emit SwitchRewardManager(oldrewardManager, newRewardManager);
    }

    /**
     * @notice move all the funds from the old strategy to the new strategy
     * @dev can be called by only owner
     * @param newStrategy, address of the new staking strategy
     * Emits {SwitchStrategy} event
     */
    function switchStrategy(address newStrategy) external onlyOwner {
        address oldStrategy = address(strategy);
        if (oldStrategy != address(0)) {
            uint amount = _getStrategyBalance();
            withdrawAllFromStrategy();
            strategy = Strategy(newStrategy);
            depositInStrategy(amount);
        }
        strategy = Strategy(newStrategy);
        emit SwitchStrategy(oldStrategy, newStrategy);
    }

    /**
     * @notice Deposit stable token to smart contract
     * @dev Transfers the approved stable token from msg.sender to lender pool
     * @param amount, the number of stable token to be deposited
     *
     * Requirements:
     *
     * - `amount` should be greater than zero
     * - `amount` must be approved from the stable token contract for the LenderPool contract
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
        rewardManager.increaseDeposit(msg.sender, amount);
        _lender[msg.sender].deposit+=amount;
    }

    /**
     * @notice converts all the deposited stable token into tStable token and transfers to the lender
     * @dev calculates the tStable token lender can claim and transfers it to the lender
     */
    function withdrawAllDeposit() external {
        uint balance = _lender[msg.sender].deposit;
        require(balance > 0, "No amount deposited");
        rewardManager.withdrawDeposit(msg.sender, _lender[msg.sender].deposit);
        _lender[msg.sender].deposit = 0;
        tStable.mint(msg.sender, balance);
    }

    /**
     * @notice converts the given amount of stable token into tStable token and transfers to lender
     * @dev checks the required condition and converts stable token to tStable and transfers to lender
     * @param amount, total amount of stable token to be converted to tStable token
     */
    function withdrawDeposit(uint amount) external {
        require(amount > 0, "amount must be positive integer");
        uint balance = _lender[msg.sender].deposit;
        require(balance>=amount,"amount request more than deposit");
        rewardManager.withdrawDeposit(msg.sender, amount);
        _lender[msg.sender].deposit -= amount;
        tStable.mint(msg.sender, amount);
    }

    /**
     * @notice send lender all the reward
     * @dev update the pendingReward and mint tStable token and send to lender
     *
     * Emits {Withdraw} event
     */
    function claimRewards() external {
        rewardManager.claimRewards(msg.sender);
    }

    /**
     * @notice Updates the Verification contract address
     * @dev changes verification Contract must complies with `IVerification`
     * @param _verificationAddress, address of the new Verification contract
     *
     * Emits {VerificationContractUpdated} event
     */
    function updateVerificationContract(address _verificationAddress)
        external
        onlyOwner
    {
        address oldVerificationAddress = address(verification);
        verification = IVerification(_verificationAddress);
        emit VerificationContractUpdated(
            oldVerificationAddress,
            _verificationAddress
        );
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
    function rewardOf(address lender) external view returns (uint[] memory) {
        return rewardManager.rewardOf(lender);
    }

    function getStrategyBalance() external view onlyOwner returns (uint) {
        return _getStrategyBalance();
    }

    /**
     * @notice withdraw all stable token from staking pool
     * @dev only owner can call this function
     */
    function withdrawAllFromStrategy() public onlyOwner {
        uint amount = _getStrategyBalance();
        strategy.withdraw(amount);
    }

    /**
     * @notice withdraw stable token from staking pool
     * @dev only owner can call this function
     * @param amount, total amount to be withdrawn from staking strategy
     */
    function withdrawFromStrategy(uint amount) public onlyOwner {
        require(
            _getStrategyBalance() >= amount,
            "Balance less than requested."
        );
        strategy.withdraw(amount);
    }

    /**
     * @notice deposit stable token to staking strategy
     * @dev only owner can call this function
     * @param amount, total amount to deposit
     */
    function depositInStrategy(uint amount) public onlyOwner {
        stable.approve(address(strategy), amount);
        strategy.deposit(amount);
    }

    /**
     * @notice deposit all stable token to staking strategy
     * @dev only owner can call this function
     */
    function depositAllInStrategy() public onlyOwner {
        uint amount = stable.balanceOf(address(this));
        stable.approve(address(strategy), amount);
        strategy.deposit(amount);
    }

    function _getStrategyBalance() private view returns (uint) {
        return strategy.getBalance();
    }
}
