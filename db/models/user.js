const Model = require("objection").Model;

class User extends Model {
    static get tableName() { return "users"; }

    static get jsonSchema() {
        return {
            type: "object",
            properties: {
                id: {type: "integer"},
                email: {type: "string"},
                password: {type: "string"},
                is_active: {type: "boolean"},
                last_activity_date: {type: ["object", "null"]},
            }
        }
    }
}

module.exports = User;