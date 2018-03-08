const bcrypt = require("bcryptjs");
const Joi = require("joi");

const routes = [
    {
        method: 'POST',
        path: '/auth',
        config: {
            auth: false,
            validate: {
                payload: {
                    email: Joi.string().required(),
                    password: Joi.string().required()
                }
            }
        },
        handler: async (request, h) => {
            const uow = await request.app.getNewUoW();
            const user = await uow.usersRepository.getUserByEmail(request.payload.email);

            if (user == null || !user.is_active || !bcrypt.compareSync(request.payload.password, user.password)) {
                return h.response(null).code(401);
            } else {
                request.app.currentUser = user;
                return "";
            }
        }
    }
];

module.exports = routes;