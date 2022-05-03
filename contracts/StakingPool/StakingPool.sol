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
    IAaveLendingPool public aave =
        IAaveLendingPool(0x7d2768dE32b0b80b7a3454c06BdAc94A69DDc7A9);
    bytes32 public constant LENDER_POOL = keccak256("LENDER_POOL");

    constructor(address _stableAddress) {
        stable = IToken(_stableAddress);
    }

    function deposit(uint amount) external {
        emit Deposit(amount);
    }

    function withdraw(uint amount) external onlyRole(LENDER_POOL) {
        emit Withdraw(amount);
    }
}
