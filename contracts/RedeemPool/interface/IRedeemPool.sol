//SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;

interface IRedeemPool {
    function depositStable(uint amount) external;

    function getStable(uint amount) external;
}
