module.exports = {
    client: "postgresql",
    connection: process.env.DB_CONNECTION_STRING != null ? process.env.DB_CONNECTION_STRING : {
        host: process.env.DB_HOST || "localhost",
        port: process.env.DB_PORT || 5432,
        user: process.env.DB_USER || "postgres",
        password: process.env.DB_PASSWORD || "password",
        database: process.env.DB_DATABASE || "garage_door",
    },
    migrations: {
        tableName: process.env.DB_MIGRATIONS_TABLE_NAME || "knex_migrations"
    }
};