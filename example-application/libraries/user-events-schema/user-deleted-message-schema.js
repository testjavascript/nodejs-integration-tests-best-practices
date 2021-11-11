"use strict";
exports.__esModule = true;
exports.UserDeletedMessageValidator = void 0;
var UserDeletedMessageValidator = function (message) {
    if (!message.userId) {
        return false;
    }
    // more validations here
    return true;
};
exports.UserDeletedMessageValidator = UserDeletedMessageValidator;
