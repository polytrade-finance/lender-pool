//SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @author Polytrade
 * @title Token
 */
interface IToken is IERC20 {
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
    function mint(address to, uint amount) external;

    /**
     * @notice adds new minter address
     * @dev grants `MINTER_ROLE` to address `minter`
     * @param minter, address of the new minter
     *
     * Emits a {RoleGranted} event
     */
    function setMinter(address minter) external;
}
