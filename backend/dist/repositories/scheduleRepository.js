"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.scheduleRepository = void 0;
const mockData_1 = require("../database/mockData");
const driverRepository_1 = require("./driverRepository");
class ScheduleRepository {
    shifts = [];
    constructor() {
        this.init();
    }
    init() {
        const drivers = driverRepository_1.driverRepository.findAll(true);
        this.shifts = (0, mockData_1.generateSeedShifts)(drivers);
    }
    findShifts(startDate, endDate, driverId) {
        return this.shifts.filter(shift => {
            if (startDate && shift.date < startDate)
                return false;
            if (endDate && shift.date > endDate)
                return false;
            if (driverId && shift.driverId !== driverId)
                return false;
            return true;
        });
    }
    findShift(driverId, date) {
        return this.shifts.find(s => s.driverId === driverId && s.date === date);
    }
    upsertShift(driverId, date, status) {
        const existing = this.findShift(driverId, date);
        if (existing) {
            existing.status = status;
            return existing;
        }
        else {
            const newShift = {
                id: `shift-${driverId}-${date}`,
                driverId,
                date,
                status
            };
            this.shifts.push(newShift);
            return newShift;
        }
    }
    getOffDays(startDate, endDate) {
        return this.shifts.filter(shift => {
            if (shift.status !== '휴무')
                return false;
            if (startDate && shift.date < startDate)
                return false;
            if (endDate && shift.date > endDate)
                return false;
            return true;
        });
    }
}
exports.scheduleRepository = new ScheduleRepository();
