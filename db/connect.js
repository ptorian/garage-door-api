const objection = require("objection");
const Knex = require("knex");

const Model = objection.Model;

const knexConfig = require("./knexfile");

const knex = Knex(knexConfig);

Model.knex(knex);

module.exports = {
    knex: knex,
    Model: Model
};