"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.driverRepository = void 0;
const mockData_1 = require("../database/mockData");
class DriverRepository {
    drivers = [...mockData_1.initialDrivers];
    findAll(includeDeleted = false) {
        if (includeDeleted)
            return this.drivers;
        return this.drivers.filter(d => !d.isDeleted);
    }
    findById(id) {
        return this.drivers.find(d => d.id === id && !d.isDeleted);
    }
    create(dto) {
        const newDriver = {
            id: `drv-${Date.now()}`,
            name: dto.name,
            phone: dto.phone,
            routeNumber: dto.routeNumber,
            contractType: dto.contractType,
            createdAt: new Date().toISOString(),
            isDeleted: false
        };
        this.drivers.push(newDriver);
        return newDriver;
    }
    update(id, dto) {
        const index = this.drivers.findIndex(d => d.id === id && !d.isDeleted);
        if (index === -1)
            return null;
        const existing = this.drivers[index];
        const updated = {
            ...existing,
            name: dto.name !== undefined ? dto.name : existing.name,
            phone: dto.phone !== undefined ? dto.phone : existing.phone,
            routeNumber: dto.routeNumber !== undefined ? dto.routeNumber : existing.routeNumber,
            contractType: dto.contractType !== undefined ? dto.contractType : existing.contractType
        };
        this.drivers[index] = updated;
        return updated;
    }
    softDelete(id) {
        const index = this.drivers.findIndex(d => d.id === id && !d.isDeleted);
        if (index === -1)
            return false;
        this.drivers[index].isDeleted = true;
        return true;
    }
}
exports.driverRepository = new DriverRepository();
