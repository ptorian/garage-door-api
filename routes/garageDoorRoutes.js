const routes = [
    {
        method: "GET",
        path: "/garage-door/status",
        handler: async (request, h) => {
            const piProvider = request.app.getPiProvider();
            const status = await piProvider.getGarageDoorStatus();
            return {open: status === 0};
        }
    },
    {
        method: "POST",
        path: "/garage-door/opener/trigger",
        handler: async (request, h) => {
            const piProvider = request.app.getPiProvider();
            await piProvider.activateGarageDoorOpener();
            return "";
        }
    }
];

module.exports = routes;