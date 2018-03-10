const bcrypt = require("bcryptjs");
const Joi = require("joi");

const routes = [
    {
        method: 'GET',
        path:'/users',
        handler: async (request, reply) => {
            const uow = await request.app.getNewUoW();
            const users = await uow.usersRepository.getAllUsers();

            users.forEach(x => x.password = null);

            reply(users);
        }
    },
    {
        method: 'GET',
        path: '/users/{userId}',
        config: {
            validate: {
                params: {
                    userId: Joi.number().integer().required()
                }
            }
        },
        handler: async (request, h) => {
            const uow = await request.app.getNewUoW();
            const user = await uow.usersRepository.getUserById(request.params.userId);

            if (user == null) {
                return h.response("").code(404);
            } else {
                user.password = null;
                return user;
            }
        }
    },
    {
        method: 'POST',
        path: '/users',
        config: {
            validate: {
                payload: {
                    email: Joi.string().email().required(),
                    password: Joi.string().required(),
                    is_active: Joi.boolean().required()
                }
            }
        },
        handler: async (request, h) => {
            const uow = await request.app.getNewUoW();
            await uow.beginTransaction();
            const newUser = request.payload;

            if (newUser.password != null) {
                const salt = bcrypt.genSaltSync(12);
                newUser.password = bcrypt.hashSync(newUser.password, salt);
            }
            const user = await uow.usersRepository.createUser(newUser);

            await uow.commitTransaction();

            user.password = null;

            return h.response(user).code(204);
        }
    }
];

module.exports = routes;