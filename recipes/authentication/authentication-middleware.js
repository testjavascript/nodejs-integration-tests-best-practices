const jwt = require("jsonwebtoken");
const config = require("./config");

const authenticationMiddleware = (req, res, next) => {
    //This is where some authentication & authorization logic comes, for example a place to
    //validate JWT integrity
    let succeeded = false;
    const authenticationHeader = req.headers["authorization"];
    try {
        const decoded = jwt.verify(authenticationHeader, config.JWTSecret);
        req.user = decoded.data;
        succeeded = true;
    } catch (e) {
        console.log(e)
    }

    if (succeeded) {
        return next();
    } else {
        res.status(401).end();
        return;
    }
};

module.exports.authenticationMiddleware = authenticationMiddleware;