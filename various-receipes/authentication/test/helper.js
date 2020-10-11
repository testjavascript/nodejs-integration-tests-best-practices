const jwt = require("jsonwebtoken");
const config = require("../config");

function signTokenSynchronously(user, role, expirationInMinutes) {
    token = jwt.sign({
        exp: expirationInMinutes,
        data: {
            username: 'test-user',
            role: 'user'
        },
    }, config.JWTSecret);

    return token;
}

module.exports = signTokenSynchronously;