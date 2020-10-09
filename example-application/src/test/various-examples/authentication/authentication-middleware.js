const authenticationMiddleware = ((req, res, next) => {
    //This is where some authentication & authorization logic comes, for example a place to 
    //validate JWT integrity
    const authenticationHeader = req.headers['authorization'];
    console.log(`About to authorize a request, header is ${authenticationHeader}`);
    if (authenticationHeader !== 'some-production-value') {
        res.status(401).end();
        return;
    }
    next();
})

module.exports.authenticationMiddleware = authenticationMiddleware;