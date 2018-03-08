const {knex, Model} = require("./connect");
const {UsersRepository} = require("./repositories");
const models = require("./models");

class UnitOfWork {
    constructor() {
        this._knex = knex;
        this._Model = Model;
        this._models = models;
        this._transaction = null;
    }

    get usersRepository() {
        return new UsersRepository(this);
    }

    async beginTransaction() {
        if (this._transaction != null) {
            throw new Error("A transaction already exists for this unit of work");
        }
        await new Promise(resolve => {
            knex.transaction(trx => {
                this._transaction = trx;
                resolve();
            });
        });
    }

    async commitTransaction() {
        if (this._transaction == null) {
            throw new Error("A transaction does not exist for this unit of work");
        }
        await this._transaction.commit();
        this._transaction = null;
    }

    async rollbackTransaction() {
        if (this._transaction == null) {
            throw new Error("A transaction does not exist for this unit of work");
        }
        await this._transaction.rollback();
        this._transaction = null;
    }

    get inTransaction() {
        return this._transaction != null;
    }
}

module.exports = UnitOfWork;