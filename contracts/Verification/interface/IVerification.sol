//SPDX-License-Identifier: MIT
pragma solidity ^0.8.14;

/**
 * @author Polytrade
 * @title IVerification
 */
interface IVerification {
    /**
     * @notice Emits when new kyc Limit is set
     * @dev Emitted when new kycLimit is set by the owner
     * @param kycLimit, new value of kycLimit
     */
    event ValidationLimitUpdated(uint kycLimit);

    function setValidation(address user, bool status) external;

    function updateValidationLimit(uint validationLimit) external;

    /**
     * @notice Returns whether a user's KYC is verified or not
     * @dev returns a boolean if the KYC is valid
     * @param user, address of the user to check
     * @return returns true if user's KYC is valid or false if not
     */
    function isValid(address user) external view returns (bool);

    function isValidationRequired(uint amount) external view returns (bool);
}
