//SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;

interface IRedeemPool {
    event StableWithdrawn(uint amount);
    event StableDeposited(uint amount);

    function depositStable(uint amount) external;

    function getStable(uint amount) external;
}
