//SPDX-License-Identifier: MIT
pragma solidity =0.8.15;

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

    /**
     * @notice update the validation limit before verification is required
     * @dev update validationLimit
     * @param validationLimit, limit beforeValidation is required
     */
    function updateValidationLimit(uint validationLimit) external;

    /**
     * @notice Returns whether a user's KYC is verified or not
     * @dev returns a boolean if the KYC is valid
     * @param user, address of the user to check
     * @return returns true if user's KYC is valid or false if not
     */
    function isValid(address user) external view returns (bool);

    /**
     * @notice Returns whether a validation is required or not based on deposit
     * @dev returns a boolean if the KYC is required or not
     * @param user, address of the user to check
     * @param amount, amount to be added
     * @return returns a boolean if the amount requires a Validation or not
     */
    function isValidationRequired(address user, uint amount)
        external
        view
        returns (bool);
}
