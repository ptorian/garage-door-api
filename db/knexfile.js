const config = require("./config");

module.exports = {
    client: "postgresql",
    connection: {
        host: config.dbHost,
        port: config.dbPort,
        user: config.dbUser,
        password: config.dbPassword,
        database: config.dbDatabase,
    },
    migrations: {
        tableName: config.dbMigrationsTableName
    }
};
