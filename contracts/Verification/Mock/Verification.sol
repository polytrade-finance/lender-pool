//SPDX-License-Identifier: MIT
pragma solidity ^0.8.14;

import "../interface/IVerification.sol";
import "../../LenderPool/interface/ILenderPool.sol";

/**
 * @author Polytrade
 * @title Verification
 */
contract Verification is IVerification {
    mapping(address => bool) public userValidation;

    uint public validationLimit;
    ILenderPool public lenderPool;

    constructor(address _lenderPool) {
        lenderPool = ILenderPool(_lenderPool);
    }

    /**
     * @notice Function for test purpose to approve/revoke Validation for any user
     * @dev Not for PROD
     * @param user, address of the user to set Validation
     * @param status, true = approve Validation and false = revoke Validation
     */
    function setValidation(address user, bool status) external {
        userValidation[user] = status;
    }

    /**
     * @notice Updates the limit for the Validation to be required
     * @dev updates validationLimit variable
     * @param _validationLimit, new value of depositLimit
     *
     * Emits {NewValidationLimit} event
     */
    function updateValidationLimit(uint _validationLimit) external {
        validationLimit = _validationLimit;
        emit ValidationLimitUpdated(_validationLimit);
    }

    /**
     * @notice Returns whether a user's Validation is verified or not
     * @dev returns a boolean if the Validation is valid
     * @param user, address of the user to check
     * @return returns true if user's Validation is valid or false if not
     */
    function isValid(address user) external view returns (bool) {
        return userValidation[user];
    }

    /**
     * @notice `isValidationRequired` returns if Validation is required to deposit `amount` on LenderPool
     * @dev returns true if Validation is required otherwise false
     */
    function isValidationRequired(address user, uint amount)
        external
        view
        returns (bool)
    {
        if (userValidation[user]) {
            return false;
        }
        uint deposit = lenderPool.getDeposit(user);
        return deposit + amount >= validationLimit;
    }
}
