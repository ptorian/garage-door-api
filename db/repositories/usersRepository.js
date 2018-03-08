const _ = require("lodash");

class UsersRepository {
    constructor(uow) {
        this.uow = uow;
    }

    async getAllUsers() {
        const q = this.uow._models.User
            .query(this.uow._transaction);

        const users = await q;
        return users;
    }

    async getUserById(userId) {
        const q = this.uow._models.User
            .query(this.uow._transaction)
            .findById(userId);

        const user = await q;
        return user;
    }

    async getUserByEmail(email) {
        const q = this.uow._models.User
            .query(this.uow._transaction)
            .findOne({email});

        const user = await q;
        return user;
    }

    async createUser(user) {
        const userModel = this.uow._models.User.fromJson(_.pick(user, ["email", "password", "is_active", "last_activity_date"]));
        const q = this.uow._models.User
            .query(this.uow._transaction)
            .insert(userModel)
            .returning("*");

        const newUser = await q;
        return newUser;
    }
}

module.exports = UsersRepository;