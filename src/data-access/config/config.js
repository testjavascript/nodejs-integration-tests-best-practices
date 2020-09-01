module.exports = {
  username: 'myuser',
  password: 'myuserpassword',
  database: 'shop',
  host: 'localhost',
  port: 54320,
  logging: false,
  dialect: 'postgres',
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
};
