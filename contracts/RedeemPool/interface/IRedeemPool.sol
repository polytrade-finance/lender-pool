//SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;

interface IRedeemPool {
    /**
     * @notice Emits when tStable token is exchanged for stable token
     * @param amount, the number of tokens exchanged
     */
    event StableWithdrawn(uint amount);

    /**
     * @notice Emits when stable token is added to the Redeem Pool
     * @param amount, the number of stable token deposited
     */
    event StableDeposited(uint amount);

    /**
     * @notice Deposit stable token to smart contract
     * @dev Transfers the approved stable token from msg.sender to Redeem Pool
     * @param amount, the number of stable token deposited
     *
     * Requirements:
     *
     * - `amount` should be greater than zero
     * - `amount` must be approved from the stable token contract for the RedeemPool contract
     *
     * Emits {StableDeposited} event
     */
    function depositStable(uint amount) external;

    /**
     * @notice exchange tStable token for the stable token
     * @dev Transfers the approved tStable token from msg.sender to redeem pool and burn it
     * @dev Transfers the  equivalent amount of stable token from redeem pool to msg.sender
     * @param amount, the number of tokens to be exchanged
     *
     * Requirements:
     *
     * - `amount` should be greater than zero
     * - `amount` must be approved from the tStable token contract for the RedeemPool contract
     * - `amount` must be less than balanceOf stable token of Redeem Pool
     *
     * Emits {StableWithdrawn} event
     */
    function convertToStable(uint amount) external;
}
