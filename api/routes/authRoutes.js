const bcrypt = require("bcryptjs");

const routes = [
    {
        method: 'POST',
        path: '/auth',
        config: {auth: false},
        handler: async (request, h) => {
            if (request.payload == null || request.payload.username !== "admin" || request.payload.password !== "password") {
                return h.response(null).code(401);
            } else {
                request.app.isAuthenticated = true;
                return "";
            }
        }
    }
];

module.exports = routes;