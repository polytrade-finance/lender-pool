//SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "./interface/IAaveLendingPool.sol";
import "../Token/interface/IToken.sol";
import "./interface/IStakingPool.sol";
/**
 * @author Polytrade
 * @title StakingPool
 */
contract StakingPool is IStakingPool, AccessControl {
    using SafeERC20 for IToken;

    IToken public stable;
    IToken public aStable;

    IAaveLendingPool public aave =
        IAaveLendingPool(0x8dFf5E27EA6b7AC08EbFdf9eB090F32ee9a30fcf);

    bytes32 public constant LENDER_POOL = keccak256("LENDER_POOL");
    bytes32 public constant LENDING_POOL = keccak256("LENDING_POOL");

    constructor(address _stable, address _aStable) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        stable = IToken(_stable);
        aStable = IToken(_aStable);
    }

    /**
     * @notice transfer funds to aave lending pool
     * @dev accepts token from msg.sender and transfers to aave lending pool
     * @param amount, total amount accepted from user and transferred to aave
     */
    function deposit(uint amount) external {
        require(
            stable.transferFrom(msg.sender, address(this), amount),
            "stable Transfer failed!"
        );
        stable.approve(address(aave), amount);
        aave.deposit(address(stable), amount, address(this), 0);
        emit Deposit(amount);
    }

    /**
     * @notice withdraw funds from aave and send to lending pool
     * @dev can be called by only lender pool
     * @param amount, total amount accepted from user and transferred to aave
     */
    function withdraw(uint amount) external onlyRole(LENDING_POOL){
        //add access control onlyRole(LENDER_POOL)
        //aStable.approve(address(aave), amount);
        aave.withdraw(address(stable), amount, msg.sender);
        emit Withdraw(amount);
    } 
}
