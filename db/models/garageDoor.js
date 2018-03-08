const Model = require("objection").Model;

module.exports = class GarageDoor extends Model {
    static get tableName() { return "garage_doors"; }

    static get jsonSchema() {
        return {
            type: "object",
            properties: {
                id: {type: "string"},
                status: {type: ["string", "null"]},
                last_seen_date: {type: ["object", "null"]},
            }
        }
    }
};