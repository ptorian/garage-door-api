const Joi = require("joi");

const {getGarageDoorOpenerSocketHandlerByGarageDoorId} = require("../sockets/garageDoorOpenerSocketHandler");

const routes = [
    {
        method: "GET",
        path: "/garage-doors",
        handler: async (request, h) => {
            const uow = await request.app.getNewUoW();
            const garageDoors = await uow.garageDoorsRepository.getAllGarageDoors();

            return garageDoors;
        }
    },
    {
        method: "POST",
        path: "/garage-doors/{garageDoorId}/trigger-opener",
        config: {
            validate: {
                params: {
                    garageDoorId: Joi.string().required()
                }
            }
        },
        handler: (request, h) => {
            const garageDoorOpenerSocketHandler = getGarageDoorOpenerSocketHandlerByGarageDoorId(request.params.garageDoorId);
            if (garageDoorOpenerSocketHandler == null) {
                return h.response("").code(404);
            } else {
                garageDoorOpenerSocketHandler.triggerOpener();
                return "";
            }
        }
    }
];

module.exports = routes;