require('dotenv').config();

module.exports = {
  development: {
    username: process.env.User,
    password: process.env.Password,
    database: process.env.Database,
    host: process.env.Host,
    dialect: "mysql"
  },
  test: {
    username: process.env.User,
    password: process.env.Password,
    database: process.env.Database,
    host: process.env.Host,
    dialect: "mysql"
  },
  production: {
    username: process.env.User,
    password: process.env.Password,
    database: process.env.Database,
    host: process.env.Host,
    dialect: "mysql"
  }
}; 