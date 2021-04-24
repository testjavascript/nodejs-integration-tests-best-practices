module.exports = {
  username: "myuser",
  password: "myuserpassword",
  database: "shoppost",
  host: "localhost",
  port: 54310,
  logging: false,
  dialect: "postgres",
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
};
