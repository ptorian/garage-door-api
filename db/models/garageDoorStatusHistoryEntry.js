const Model = require("objection").Model;

module.exports = class GarageDoorStatusHistoryEntry extends Model {
    static get tableName() { return "garage_door_status_history_entries"; }

    static get jsonSchema() {
        return {
            type: "object",
            properties: {
                id: {type: "number"},
                status: {type: "string"},
                raw_status: {type: "number"},
                activity_date: {type: ["object", "null"]},
            }
        }
    }
};