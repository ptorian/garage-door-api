const routes = [
    {
        method: "GET",
        path: "/garage-door/status",
        handler: (request, h) => {
            return new Promise((resolve, reject) => {
                const firstSocket = Object.values(request.server.app.socketsByGarageDoorId)[0];
                if (firstSocket == null) {
                    resolve(h.response({"message": "No connected garage door openers"}).code(400));
                } else {
                    firstSocket.emit("getGarageDoorStatus", null, status => {
                        resolve({open: status === 0});
                    });
                }
            });
        }
    },
    {
        method: "POST",
        path: "/garage-door/opener/trigger",
        handler: (request, h) => {
            const firstSocket = Object.values(request.server.app.socketsByGarageDoorId)[0];
            if (firstSocket == null) {
                return h.response({"message": "No connected garage door openers"}).code(400);
            } else {
                firstSocket.emit("toggleGarageDoorState");
                return "";
            }
        }
    }
];

module.exports = routes;