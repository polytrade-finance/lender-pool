//SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IToken is IERC20 {
    function mint(address to, uint amount) external;

    function setMinter(address minter) external;

    function burn(address account, uint amount) external;
}
