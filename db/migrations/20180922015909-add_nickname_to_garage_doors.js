
exports.up = async function(knex, Promise) {
    await knex.schema.table("garage_doors", t => {
        t.text("nickname");
    });
};

exports.down = async function(knex, Promise) {
    await knex.schema.table("garage_doors", t => {
        t.dropColumn("nickname");
    });
};
