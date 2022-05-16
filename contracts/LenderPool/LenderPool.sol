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

/**
 * @author Polytrade
 * @title LenderPool V2
 */
contract LenderPool is ILenderPool, Ownable {
    using SafeERC20 for IToken;
    //mapping(lender address => struct Lender)
    mapping(address => Lender) private _lender;
    //mapping(token address => mapping(lender address => round))
    mapping(address => mapping(address=>uint16)) public round;
    //mapping(token address => mapping(lender address => pending reward))
    mapping(address => mapping(address=>uint)) public pendingRewards;

    IToken public immutable stable;
    IRedeemPool public immutable redeemPool;
    IStakingStrategy public stakingStrategy;
    IVerification public verification;
    IRewardManager public rewardManager;

    uint public kycLimit;

    constructor(
        address _stableAddress,
        address _redeemPool
    ) {
        stable = IToken(_stableAddress);
        redeemPool = IRedeemPool(_redeemPool);
    }

    function switchRewardManager(address newRewardManager) external onlyOwner {
        address oldrewardManager = address(rewardManager);
        rewardManager = IRewardManager(newRewardManager);
        emit switchRewardManager(oldrewardManager,newRewardManager);
    }

    /**
     * @notice move all the funds from the old strategy to the new strategy
     * @dev can be called by only owner
     * @param newStakingStrategy, address of the new staking strategy
     * Emits {SwitchStrategy} event
     */
    function switchStrategy(address newStakingStrategy) external onlyOwner {
        address oldStakingStrategy = address(stakingStrategy);
        if (oldStakingStrategy != address(0)) {
            uint amount = _getStakingStrategyBalance();
            withdrawAllFromStakingStrategy();
            stakingStrategy = StakingStrategy(newStakingStrategy);
            depositInStakingStrategy(amount);
        }
        stakingStrategy = StakingStrategy(newStakingStrategy);
        emit SwitchStrategy(oldStakingStrategy, newStakingStrategy);
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
            (_lender[msg.sender].deposit + amount < kycLimit) ||
                verification.isValid(msg.sender),
            "Need to have valid KYC"
        );

        if (_lender[msg.sender].startPeriod > 0) {
            rewardManager.updatePendingReward(msg.sender);
        } else {
            _lender[msg.sender].startPeriod = uint40(block.timestamp);
        }

        _lender[msg.sender].deposit += amount;
        //_lender[msg.sender].round = currentRound;
        rewardManager.updateRound(msg.sender);
        emit Deposit(msg.sender, amount);
        tradeReward.deposit(msg.sender, amount);
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
        rewardManager.updatePendingReward(msg.sender);
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
     * @notice Updates the limit for the KYC to be required
     * @dev updates kycLimit variable
     * @param _kycLimit, new value of depositLimit
     *
     * Emits {NewKYCLimit} event
     */
    function updateKYCLimit(uint _kycLimit) external onlyOwner {
        kycLimit = _kycLimit;
        emit NewKYCLimit(_kycLimit);
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
        rewardManager.updatePendingReward(msg.sender);
        uint amount = _lender[msg.sender].pendingRewards +
            _lender[msg.sender].deposit;
        require(
            stable.balanceOf(address(redeemPool)) >= amount,
            "Insufficient balance in pool"
        );
        _lender[msg.sender].pendingRewards = 0;
        tradeReward.withdraw(msg.sender, _lender[msg.sender].deposit);
        _lender[msg.sender].deposit = 0;
        tStable.mint(address(this), amount);
        tStable.approve(address(redeemPool), amount);
        redeemPool.redeemStableTo(amount, msg.sender);
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
        rewardManager.rewardOf(lender);
    }

    function getStakingStrategyBalance()
        external
        view
        onlyOwner
        returns (uint)
    {
        return _getStakingStrategyBalance();
    }

    /**
     * @notice withdraw all stable token from staking pool
     * @dev only owner can call this function
     */
    function withdrawAllFromStakingStrategy() public onlyOwner {
        uint amount = _getStakingStrategyBalance();
        stakingStrategy.withdraw(amount);
    }

    /**
     * @notice withdraw stable token from staking pool
     * @dev only owner can call this function
     * @param amount, total amount to be withdrawn from staking strategy
     */
    function withdrawFromStakingStrategy(uint amount) public onlyOwner {
        require(
            _getStakingStrategyBalance() >= amount,
            "Balance less than requested."
        );
        stakingStrategy.withdraw(amount);
    }

    /**
     * @notice deposit stable token to staking strategy
     * @dev only owner can call this function
     * @param amount, total amount to deposit
     */
    function depositInStakingStrategy(uint amount) public onlyOwner {
        stable.approve(address(stakingStrategy), amount);
        stakingStrategy.deposit(amount);
    }

    /**
     * @notice deposit all stable token to staking strategy
     * @dev only owner can call this function
     */
    function depositAllInStakingStrategy() public onlyOwner {
        uint amount = stable.balanceOf(address(this));
        stable.approve(address(stakingStrategy), amount);
        stakingStrategy.deposit(amount);
    }

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
        require(amount > 0, "Cannot withdraw 0 amount");
        require(
            _lender[msg.sender].deposit >= amount,
            "Invalid amount requested"
        );
        if (currentRound > 0) {
            rewardManager.updatePendingReward(msg.sender);
        }
        tradeReward.withdraw(msg.sender, amount);
        _lender[msg.sender].deposit -= amount;
        emit Withdraw(msg.sender, amount);
        tStable.mint(msg.sender, amount);
    }

    function _getStakingStrategyBalance() private view returns (uint) {
        return stakingStrategy.getBalance();
    }

}
