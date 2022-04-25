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
     * @dev users can directly call this function using EOA
     * @param amount, the number of tokens to be exchanged
     */
    function convertToStable(uint amount) external;

    /**
     * @notice exchange tStable token for the stable token
     * @dev this function can be called using another smart contract
     * @param amount, the number of tokens to be exchanged
     * @param account, address of the account that will receive the stable token
     */
    function toStable(uint amount, address account) external;
}
