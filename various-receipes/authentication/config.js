//This simulates production configuration provider where keys are put in JSON and/or
//in env vars

module.exports = {
    JWTSecret: 'secret'
}
process.env.JWT_SECRET = 'secret';