const bcrypt = require("bcryptjs");

const routes = [
    {
        method: 'GET',
        path: '/users/{userId}',
        config: {auth: false},
        handler: async (request, h) => {
            return {id: 1, username: "admin"};
        }
    }
];

module.exports = routes;