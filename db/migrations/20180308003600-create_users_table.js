
exports.up = async function(knex, Promise) {
    await knex.schema.createTable("users", t => {
        t.increments("id").primary();
        t.specificType("email", "citext").notNullable();
        t.text("password").notNullable();
        t.boolean("is_active").notNullable();
        t.timestamp("last_activity_date");
    });
};

exports.down = async function(knex, Promise) {
    await knex.schema.dropTableIfExists("users");
};
