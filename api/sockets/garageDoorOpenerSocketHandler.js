const UoW = require("../../db");
const config = require("../config");
const {getAllClients} = require("./clientSocketHandler");

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

function getGarageDoorOpenerSocketHandlerByGarageDoorId(garageDoorId) {
    return garageDoorOpenerSocketHandlersByGarageDoorId.hasOwnProperty(garageDoorId.toLowerCase()) ? garageDoorOpenerSocketHandlersByGarageDoorId[garageDoorId.toLowerCase()] : null;
}

class GarageDoorOpenerSocketHandler {
    constructor(logger, socket, garageDoorId) {
        this.logger = logger;
        this.socket = socket;
        this.garageDoorId = garageDoorId.toLowerCase();
        this.openingTimer = null;
        this.closingTimer = null;
    }

    async triggerOpener() {
        this.clearTimeouts();
        const uow = new UoW();
        const garageDoor = await uow.garageDoorsRepository.getGarageDoorById(this.garageDoorId);

        if (garageDoor.status === "open" || garageDoor.status === "opening") {
            this.closingTimer = setTimeout(async () => {
                if (this.closingTimer != null) {
                    await this.setStatus("open", 0);
                    this.closingTimer = null;
                }
            }, config.closingTimespan);
            await this.setStatus("closing", 0);
        } else if (garageDoor.status === "closing") {
            // if status is "closing" and we trigger the opener, we want it to be "opening"
            // instead of duplicating logic, we just re-call onGarageDoorStatusUpdated
            await this.onGarageDoorStatusUpdated(0);
        }

        this.socket.emit("toggleGarageDoorState");
    }

    async onConnect() {
        try {
            this.logger.info("socket.io garage door connected", this.garageDoorId);
            garageDoorOpenerSocketHandlersByGarageDoorId[this.garageDoorId] = this;

            const uow = new UoW();
            await uow.garageDoorsRepository.ensureGarageDoorExists(this.garageDoorId);

            this.socket.emit("getGarageDoorStatus", null, async status => {
                await this.onGarageDoorStatusUpdated(status);
                this.socket.on("heartbeat", () => this.onGarageDoorHeartbeat());
                this.socket.on("garageDoorStatus", status => this.onGarageDoorStatusUpdated(status));
                this.socket.on("disconnect", () => this.onDisconnect());
            });
        } catch (e) {
            this.logger.error(e);
        }
    }

    async setStatus(status, rawStatus) {
        this.logger.debug("setStatus", status, rawStatus);
        const uow = new UoW();
        await uow.beginTransaction();
        try {
            const garageDoor = await uow.garageDoorsRepository.ensureGarageDoorExists(this.garageDoorId);
            garageDoor.status = status;
            garageDoor.last_seen_date = new Date();
            await uow.garageDoorsRepository.updateGarageDoor(garageDoor);
            const mostRecentGarageDoorStatusHistoryEntry = await uow.garageDoorsRepository.getMostRecentGarageDoorStatusHistoryEntryForGarageDoor(this.garageDoorId);
            if (mostRecentGarageDoorStatusHistoryEntry == null || mostRecentGarageDoorStatusHistoryEntry.raw_status !== status) {
                const newGarageDoorStatusHistoryEntry = {
                    garage_door_id: this.garageDoorId,
                    status: garageDoor.status,
                    raw_status: rawStatus,
                    activity_date: new Date()
                };
                await uow.garageDoorsRepository.addGarageDoorStatusHistoryEntry(newGarageDoorStatusHistoryEntry);
            }
            await uow.commitTransaction();
            getAllClients().forEach(x => x.sendGarageDoorUpdates());
        } catch (e) {
            this.logger.error(e);
            await uow.rollbackTransaction();
        }
    }

    clearTimeouts() {
        if (this.openingTimer != null) {
            clearTimeout(this.openingTimer);
            this.openingTimer = null;
        }
        if (this.closingTimer != null) {
            clearTimeout(this.closingTimer);
            this.closingTimer = null;
        }
    }

    async onGarageDoorStatusUpdated(rawStatus) {
        this.logger.debug("onGarageDoorStatusUpdated", rawStatus);
        if (rawStatus === 0) {
            if (this.openingTimer == null) {
                this.clearTimeouts();
                await this.setStatus("opening", rawStatus);

                this.openingTimer = setTimeout(async () => {
                    if (this.openingTimer != null) {
                        await this.setStatus("open", 0);
                        this.openingTimer = null;
                    }
                }, config.openingTimespan);
            } else {
                this.clearTimeouts();
            }
        } else {
            this.clearTimeouts();
            await this.setStatus("closed", rawStatus);
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
            getAllClients().forEach(x => x.sendGarageDoorUpdates());
        } catch (e) {
            this.logger.error(e);
            await uow.rollbackTransaction();
        }
    }

    async onDisconnect() {
        try {
            if (garageDoorOpenerSocketHandlersByGarageDoorId.hasOwnProperty(this.garageDoorId) && garageDoorOpenerSocketHandlersByGarageDoorId[this.garageDoorId].socket.id === this.socket.id) {
                logger.info("socket.io garage door disconnected", this.garageDoorId);
                delete garageDoorOpenerSocketHandlersByGarageDoorId[this.garageDoorId];
            } else {
                this.logger.info("socket.io garage door disconnection ignored because replacement connection has already been established", this.garageDoorId);
            }
        } catch (e) {
            this.logger.error(e);
        }
    };
}

module.exports = {GarageDoorOpenerSocketHandler, getGarageDoorOpenerSocketHandlerByGarageDoorId};