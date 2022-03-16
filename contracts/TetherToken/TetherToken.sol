//SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "hardhat/console.sol";

contract TetherToken is ERC20 {
    uint private constant _INITIAL_SUPPLY = 1000 * (10**18);

    constructor() ERC20("Tether", "USDT") {
        _mint(msg.sender, _INITIAL_SUPPLY);
    }
}
