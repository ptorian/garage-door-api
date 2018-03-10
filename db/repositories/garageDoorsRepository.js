const _ = require("lodash");

class GarageDoors {
    constructor(uow) {
        this.uow = uow;
    }

    async getAllGarageDoors() {
        const q = this.uow._models.GarageDoor
            .query(this.uow._transaction);

        const garageDoors = await q;
        return garageDoors;
    }

    async ensureGarageDoorExists(garageDoorId) {
        const garageDoor = await this.getGarageDoorById(garageDoorId);
        if (garageDoor != null) {
            return garageDoor;
        }

        const garageDoorModel = this.uow._models.GarageDoor.fromJson({
            id: garageDoorId,
            status: null,
            last_seen_date: null
        });
        const q = this.uow._models.GarageDoor
            .query(this.uow._transaction)
            .insert(garageDoorModel)
            .returning("*");

        const newGarageDoor = await q;
        return newGarageDoor;
    }

    async getGarageDoorById(garageDoorId) {
        const q = this.uow._models.GarageDoor
            .query(this.uow._transaction)
            .findById(garageDoorId);

        const garageDoor = await q;
        return garageDoor;
    }

    async updateGarageDoor(garageDoor) {
        const garageDoorModel = this.uow._models.GarageDoor.fromJson(_.pick(garageDoor, ["id", "status", "last_seen_date"]));
        const q = this.uow._models.GarageDoor
            .query(this.uow._transaction)
            .where({id: garageDoor.id})
            .patch(garageDoorModel)
            .returning("*");

        const updatedGarageDoors = await q;
        return updatedGarageDoors.length > 0 ? updatedGarageDoors[0] : null;
    }

    async addGarageDoorStatusHistoryEntry(garageDoorStatusHistoryEntry) {
        const garageDoorStatusHistoryEntryModel = this.uow._models.GarageDoor.fromJson(_.pick(garageDoorStatusHistoryEntry, ["garage_door_id", "status", "raw_status", "activity_date"]));
        const q = this.uow._models.GarageDoorStatusHistoryEntry
            .query(this.uow._transaction)
            .insert(garageDoorStatusHistoryEntryModel)
            .returning("*");

        const newGarageDoorStatusHistoryEntry = await q;
        return newGarageDoorStatusHistoryEntry;
    }

    async getMostRecentGarageDoorStatusHistoryEntryForGarageDoor(garageDoorId) {
        const q = this.uow._models.GarageDoorStatusHistoryEntry
            .query(this.uow._transaction)
            .where({garage_door_id: garageDoorId})
            .orderBy("activity_date", "desc")
            .first();

        const mostRecentGarageDoorStatusHistoryEntryForGarageDoor = await q;
        return mostRecentGarageDoorStatusHistoryEntryForGarageDoor;
    }
}

module.exports = GarageDoors;