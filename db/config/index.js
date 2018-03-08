module.exports = {
    dbHost: process.env.DB_HOST || "localhost",
    dbPort: process.env.DB_PORT || 5432,
    dbUser: process.env.DB_USER || "postgres",
    dbPassword: process.env.DB_PASSWORD || "password",
    dbDatabase: process.env.DB_DATABASE || "garage_door",
    dbMigrationsTableName: process.env.DB_MIGRATIONS_TABLE_NAME || "knex_migrations"
};