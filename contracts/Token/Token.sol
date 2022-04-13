//SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "./interface/IToken.sol";

contract Token is IToken, ERC20, ERC20Burnable, AccessControl {
    uint8 private immutable _decimals;
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    address private _minter;

    constructor(
        string memory name_,
        string memory symbol_,
        uint8 decimals_
    ) ERC20(name_, symbol_) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _decimals = decimals_;
        _mint(msg.sender, 1_000_000_000 * (10**decimals_));
    }

    function setMinter(address minter) external {
        _minter = minter;
        grantRole(MINTER_ROLE, _minter);
    }

    function mint(address to, uint amount) external onlyRole(MINTER_ROLE) {
        _mint(to, amount);
    }

    function getMinter() external view returns (address) {
        return _minter;
    }

    function decimals() public view virtual override returns (uint8) {
        return _decimals;
    }
}
