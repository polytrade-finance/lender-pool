//SPDX-License-Identifier: MIT
pragma solidity =0.8.15;

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
     * @notice exchange tStable token for the stable token
     * @dev users can directly call this function using EOA after approving `amount`
     * @param amount, the number of tokens to be exchanged
     */
    function redeemStable(uint amount) external;

    /**
     * @notice exchange tStable token for the stable token
     * @dev burns the tStable from msg.sender and sends stable to `account`
     * @param amount, the number of tokens to be exchanged
     * @param account, address of the account that will receive the stable token
     */
    function redeemStableFor(address account, uint amount) external;
}
