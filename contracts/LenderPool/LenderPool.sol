//SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "../StakingStrategy/StakingStrategy.sol";
import "./interface/ILenderPool.sol";
import "../Token/interface/IToken.sol";
import "../RedeemPool/interface/IRedeemPool.sol";
import "../Verification/interface/IVerification.sol";
import "../RewardManager/interface/IRewardManager.sol";
import "../Reward/interface/IReward.sol";

/**
 * @author Polytrade
 * @title LenderPool V2
 */
contract LenderPool is ILenderPool, Ownable {
    using SafeERC20 for IToken;

    mapping(address => Lender) private _lender;
//    mapping(uint16 => RoundInfo) public round;

    IToken public immutable stable;
    IToken public immutable tStable;
    IToken public trade;
    IRedeemPool public immutable redeemPool;
    IStakingStrategy public strategy;
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
     * @notice move all the funds from the old strategy to the new strategy
     * @dev can be called by only owner
     * @param newStakingStrategy, address of the new staking strategy
     * Emits {SwitchStrategy} event
     */
    function switchStrategy(address newStakingStrategy) external onlyOwner {
        address oldStakingStrategy = address(strategy);
        if (oldStakingStrategy != address(0)) {
            uint amountToWithdraw = _getStrategyBalance();
            withdrawFromStrategy(amountToWithdraw);

            strategy = StakingStrategy(newStakingStrategy);

            uint amountToDeposit = stable.balanceOf(address(this));
            depositToStrategy(amountToDeposit);
        }
        strategy = StakingStrategy(newStakingStrategy);
        emit SwitchStrategy(oldStakingStrategy, newStakingStrategy);
    }

    /**
     * @notice Updates the Verification contract address
     * @dev changes verification Contract must complies with `IVerification`
     * @param _newVerification, address of the new Verification contract
     *
     * Emits {VerificationContractUpdated} event
     */
    function switchVerification(address _newVerification) external onlyOwner {
        address oldVerification = address(verification);
        verification = IVerification(_newVerification);
        emit VerificationContractUpdated(oldVerification, _newVerification);
    }

    function switchRewardManager(address _newRewardManager) external onlyOwner {
        address oldRewardManager = address(rewardManager);
        rewardManager = IRewardManager(_newRewardManager);
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
        require(amount > 0, "Lending amount is 0");

        uint allowance = stable.allowance(msg.sender, address(this));
        require(allowance >= amount, "Not enough allowance");

        require(
            !(verification.isValidationRequired(_lender[msg.sender].deposit + amount)) ||
                verification.isValid(msg.sender),
            "Need to have valid KYC"
        );

        rewardManager.increaseBalance(msg.sender, amount);
//        stableReward.deposit(msg.sender, amount);
//        if (_lender[msg.sender].startPeriod > 0) {
//            _updatePendingReward(msg.sender);
//        } else {
//            _lender[msg.sender].startPeriod = uint40(block.timestamp);
//        }

        _lender[msg.sender].deposit += amount;
//        _lender[msg.sender].round = currentRound;

        emit Deposit(msg.sender, amount);
//        tradeReward.deposit(msg.sender, amount);
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
     * @notice send lender all the reward
     * @dev update the pendingReward and mint tStable token and send to lender
     *
     * Emits {Withdraw} event
     */
    function claimRewards() external {
        rewardManager.claimRewards(msg.sender);
//        _updatePendingReward(msg.sender);
//        uint totalReward = _lender[msg.sender].pendingRewards;
//        _lender[msg.sender].pendingRewards = 0;
//        emit Withdraw(msg.sender, totalReward);
//        tStable.mint(msg.sender, totalReward);
    }



    /**
     * @notice transfers user all the reward in stable token
     * @dev calculates and mint the reward
     * @dev calls redeemStableTo function from RedeemPool to convert tStable to stable
     *
     * Requirements:
     *
     * - total reward should be not more than stable tokens in RedeemPool
     *
     */
    function redeemAll() external {
//        _updatePendingReward(msg.sender);
//        uint amount = _lender[msg.sender].pendingRewards +
//            _lender[msg.sender].deposit;
//        require(
//            stable.balanceOf(address(redeemPool)) >= amount,
//            "Insufficient balance in pool"
//        );
//        _lender[msg.sender].pendingRewards = 0;
//        tradeReward.withdraw(msg.sender, _lender[msg.sender].deposit);
//        _lender[msg.sender].deposit = 0;
//        tStable.mint(address(this), amount);
//        tStable.approve(address(redeemPool), amount);
//        redeemPool.redeemStableTo(amount, msg.sender);
    }

    /**
     * @notice returns amount of stable token deposited by the lender
     * @param lender, address of lender
     * @return returns amount of stable token deposited by the lender
     */
    function getDeposit(address lender) external view returns (uint) {
        return _lender[lender].deposit;
    }

    function getRewards(address lender) external view returns(uint[] memory) {
        return rewardManager.rewardOf(lender);
    }

//    /**
//     * @notice returns the total pending reward
//     * @dev returns the total pending reward of msg.sender
//     * @return returns the total pending reward
//     */
//    function rewardOf(address lender) external view returns (uint) {
//        if (_lender[lender].round < currentRound) {
//            return
//                _lender[lender].pendingRewards +
//                _calculateFromPreviousRounds(lender);
//        } else {
//            return
//                _lender[lender].pendingRewards + _calculateCurrentRound(lender);
//        }
//    }

    function getStrategyBalance()
        external
        view
        onlyOwner
        returns (uint)
    {
        return _getStrategyBalance();
    }

    //    /**
    //     * @notice withdraw all stable token from staking pool
    //     * @dev only owner can call this function
    //     */
    //    function withdrawAllFromStakingStrategy() public onlyOwner {
    //        uint amount = _getStrategyBalance();
    //        strategy.withdraw(amount);
    //    }

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
    function depositToStrategy(uint amount) public onlyOwner {
        stable.approve(address(strategy), amount);
        strategy.deposit(amount);
    }

    //    /**
    //     * @notice deposit all stable token to staking strategy
    //     * @dev only owner can call this function
    //     */
    //    function depositAllInStakingStrategy() public onlyOwner {
    //        uint amount = stable.balanceOf(address(this));
    //        stable.approve(address(strategy), amount);
    //        strategy.deposit(amount);
    //    }

    /**
     * @notice converts the deposited stable token of quantity `amount` into tStable token and send to the lender
     * @param amount, to be sent to the msg.sender
     *
     * Requirements:
     *
     * - deposited amount must be greater than amount requested
     * - `amount` should be greater than zero
     *
     * Emits {Withdraw} event
     */
    function _withdraw(uint amount) private {
//        require(amount > 0, "Cannot withdraw 0 amount");
//        require(
//            _lender[msg.sender].deposit >= amount,
//            "Invalid amount requested"
//        );
//        if (currentRound > 0) {
//            _updatePendingReward(msg.sender);
//        }
//        tradeReward.withdraw(msg.sender, amount);
//        _lender[msg.sender].deposit -= amount;
//        emit Withdraw(msg.sender, amount);
//        tStable.mint(msg.sender, amount);
    }

    function _getStrategyBalance() private view returns (uint) {
        return strategy.getBalance();
    }
}
