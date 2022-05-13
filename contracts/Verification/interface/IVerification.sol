//SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;

/**
 * @author Polytrade
 * @title IVerification
 */
interface IVerification {
    /**
     * @notice Returns whether a user's KYC is verified or not
     * @dev returns a boolean if the KYC is valid
     * @param user, address of the user to check
     * @return returns true if user's KYC is valid or false if not
     */
    function isValid(address user) external view returns (bool);
}
