const UoW = require("../../db");

const clients = [];

const getAllClients = () => clients;

class ClientSocketHandler {
    constructor(logger, socket) {
        this.logger = logger;
        this.socket = socket;
    }

    async onConnect() {
        this.logger.info("socket.io client connected");
        clients.push(this);
        this.socket.on("disconnect", () => this.onDisconnect());
    }

    async sendGarageDoorUpdates() {
        this.logger.info("sending garage door updates");
        const uow = new UoW();
        const garageDoors = await uow.garageDoorsRepository.getAllGarageDoors();
        this.socket.emit("garageDoorUpdates", garageDoors);
    }

    async onDisconnect() {
        const index = clients.indexOf(this);
        if (index > -1) {
            clients.splice(index, 1);
            this.logger.info("socket.io client disconnected");
        }
    };
}

module.exports = {ClientSocketHandler, getAllClients};