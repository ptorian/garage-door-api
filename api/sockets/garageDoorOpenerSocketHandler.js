const UoW = require("../../db");

/*
    If the raw status is 1 (closed) and changes to a 0 (open), then the status is set to "opening" and a timer
    is started. At the end of the timer the status is set to "open". If at any point while the timer is running
    the raw status changes back to a 1 (closed), then the timer is cancelled and the status is set to "closed".

    If the raw status is 0 (open) and changes to a 1 (closed), then the status is set to "closed".

    If the raw status is 0 (open) and the app receives a command to activate the motor, then the status is set
    to "closing" and a timer is started. If at any point while the timer is running the raw status changes to
    a 1 (closed), then the timer is cancelled and the status is set to "closed". If the timer is allowed to
    run to completion, the status is set back to "open".
 */

const garageDoorOpenerSocketHandlersByGarageDoorId = {};

class GarageDoorOpenerSocketHandler {
    constructor(logger, socket, garageDoorId) {
        this.logger = logger;
        this.socket = socket;
        this.garageDoorId = garageDoorId;
    }

    async onGarageDoorConnected() {
        try {
            this.logger.info("socket.io connected", this.garageDoorId);
            garageDoorOpenerSocketHandlersByGarageDoorId[this.garageDoorId] = this;

            const uow = new UoW();
            await uow.garageDoorsRepository.ensureGarageDoorExists(this.garageDoorId);

            this.socket.emit("getGarageDoorStatus", null, async status => {
                await this.onGarageDoorStatusUpdated(status);
                this.socket.on("heartbeat", () => this.onGarageDoorHeartbeat());
                this.socket.on("garageDoorStatus", status => this.onGarageDoorStatusUpdated(status));
                this.socket.on("disconnect", () => this.onGarageDoorDisconnected());
            });
        } catch (e) {
            this.logger.error(e);
        }
    }

    async onGarageDoorStatusUpdated(status) {
        const uow = new UoW();
        await uow.beginTransaction();
        try {
            const garageDoor = await uow.garageDoorsRepository.ensureGarageDoorExists(this.garageDoorId);
            garageDoor.status = status === 1 ? "closed" : "open";
            garageDoor.last_seen_date = new Date();
            await uow.garageDoorsRepository.updateGarageDoor(garageDoor);
            const mostRecentGarageDoorStatusHistoryEntry = await uow.garageDoorsRepository.getMostRecentGarageDoorStatusHistoryEntryForGarageDoor(this.garageDoorId);
            if (mostRecentGarageDoorStatusHistoryEntry == null || mostRecentGarageDoorStatusHistoryEntry.raw_status !== status) {
                const newGarageDoorStatusHistoryEntry = {
                    garage_door_id: this.garageDoorId,
                    status: garageDoor.status,
                    raw_status: status,
                    activity_date: new Date()
                };
                await uow.garageDoorsRepository.addGarageDoorStatusHistoryEntry(newGarageDoorStatusHistoryEntry);
            }
            await uow.commitTransaction();
        } catch (e) {
            this.logger.error(e);
            await uow.rollbackTransaction();
        }
    }

    async onGarageDoorHeartbeat() {
        const uow = new UoW();
        await uow.beginTransaction();
        try {
            const garageDoor = await uow.garageDoorsRepository.ensureGarageDoorExists(this.garageDoorId);
            garageDoor.last_seen_date = new Date();
            await uow.garageDoorsRepository.updateGarageDoor(garageDoor);
            await uow.commitTransaction();
        } catch (e) {
            this.logger.error(e);
            await uow.rollbackTransaction();
        }
    }

    async onGarageDoorDisconnected() {
        try {
            if (garageDoorOpenerSocketHandlersByGarageDoorId.hasOwnProperty(this.garageDoorId) && garageDoorOpenerSocketHandlersByGarageDoorId[this.garageDoorId].socket.id === this.socket.id) {
                logger.info("socket.io disconnected", this.garageDoorId);
                delete garageDoorOpenerSocketHandlersByGarageDoorId[this.garageDoorId];
            } else {
                this.logger.info("socket.io disconnection ignored because replacement connection has already been established", this.garageDoorId);
            }
        } catch (e) {
            this.logger.error(e);
        }
    };
}

module.exports = GarageDoorOpenerSocketHandler;