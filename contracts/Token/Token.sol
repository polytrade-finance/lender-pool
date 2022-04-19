//SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "./interface/IToken.sol";

/**
 * @author Polytrade
 * @title Token
 */
contract Token is IToken, ERC20, ERC20Burnable, AccessControl {
    uint8 private immutable _decimals;
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    constructor(
        string memory name_,
        string memory symbol_,
        uint8 decimals_
    ) ERC20(name_, symbol_) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _decimals = decimals_;
        _mint(msg.sender, 1_000_000_000 * (10**decimals_));
    }


    function burn(address account, uint amount) external {
        _burn(account, amount);
    }

    /**
     * @notice mints ERC20 token
     * @dev creates `amount` tokens and assigns them to `to`, increasing the total supply.
     * @param to, receiver address of the ERC20 address
     * @param amount, amount of ERC20 token minted
     *
     * Emits a {Transfer} event with `from` set to the zero address.
     *
     * Requirements:
     *
     * - `to` cannot be the zero address.
     */
    function mint(address to, uint amount) external onlyRole(MINTER_ROLE) {
        _mint(to, amount);
    }

    /**
     * @dev Returns the number of decimals used to get its user representation.
     */
    function decimals() public view virtual override returns (uint8) {
        return _decimals;
    }
}
