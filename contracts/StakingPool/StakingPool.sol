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
        IAaveLendingPool(0x8dFf5E27EA6b7AC08EbFdf9eB090F32ee9a30fcf);

    bytes32 public constant LENDER_POOL = keccak256("LENDER_POOL");

    constructor(address _stable) {
        stable = IToken(_stable);
    }

    function deposit(uint amount) external {
        require(
            stable.transferFrom(msg.sender, address(this), amount),
            "stable Transfer failed!"
        );
        stable.approve(address(aave), amount);
        aave.deposit(address(stable), amount, address(this), 0);
        emit Deposit(amount);
    }

    function withdraw(uint amount) external onlyRole(LENDER_POOL) {
        aave.withdraw(address(stable), amount, msg.sender);
        emit Withdraw(amount);
    }
}
