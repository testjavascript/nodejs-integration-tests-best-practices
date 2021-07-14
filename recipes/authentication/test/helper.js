const jwt = require("jsonwebtoken");
const config = require("../config");

function signTokenSynchronously(user, role) {
    return internalSignTokenSynchronously(user, role, Date.now() + (60 * 60));
}

function signExpiredTokenSynchronously(user, role) {
    return internalSignTokenSynchronously(user, role, 0);
}

function internalSignTokenSynchronously(user, role, expirationInUnixTime) {
    token = jwt.sign({
        exp: expirationInUnixTime,
        data: {
            user,
            role
        },
    }, config.JWTSecret);

    return token;
}

module.exports.signTokenSynchronously = signTokenSynchronously;
module.exports.signExpiredTokenSynchronously = signExpiredTokenSynchronously;