
exports.up = async function(knex, Promise) {
    await knex.schema.createTable("garage_door_statuses", t => {
        t.text("id").primary();
    });

    await knex("garage_door_statuses").insert([
        {id: "closed"},
        {id: "closing"},
        {id: "open"},
        {id: "opening"}
    ]);

    await knex.schema.createTable("garage_doors", t => {
        t.uuid("id").primary();

        t.text("status")
            .references("id")
            .inTable("garage_door_statuses")
            .onDelete("RESTRICT");

        t.timestamp("last_seen_date");
    });

    await knex.schema.createTable("garage_door_status_history_entries", t => {
        t.increments("id").primary();

        t.uuid("garage_door_id")
            .notNullable()
            .references("id")
            .inTable("garage_doors")
            .onDelete("CASCADE");

        t.text("status")
            .notNullable()
            .references("id")
            .inTable("garage_door_statuses")
            .onUpdate("CASCADE")
            .onDelete("RESTRICT");

        t.integer("raw_status")
            .notNullable();

        t.timestamp("activity_date")
            .notNullable();
    });
};

exports.down = async function(knex, Promise) {
    await knex.schema.dropTableIfExists("garage_door_status_history_entries");
    await knex.schema.dropTableIfExists("garage_doors");
    await knex.schema.dropTableIfExists("garage_door_statuses");
};
