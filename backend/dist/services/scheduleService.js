"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.scheduleService = void 0;
const scheduleRepository_1 = require("../repositories/scheduleRepository");
const driverRepository_1 = require("../repositories/driverRepository");
const backupRepository_1 = require("../repositories/backupRepository");
class ScheduleService {
    getScheduleGrid(startDate, endDate) {
        const drivers = driverRepository_1.driverRepository.findAll();
        const shifts = scheduleRepository_1.scheduleRepository.findShifts(startDate, endDate);
        const backupAssignments = backupRepository_1.backupRepository.findAll();
        const backupMap = new Map();
        backupAssignments.forEach(b => {
            // Key: "date_routeNumber" or "date_originalDriverId"
            backupMap.set(`${b.date}_${b.originalDriverId}`, b);
        });
        const gridRows = drivers.map(driver => {
            const driverShifts = shifts.filter(s => s.driverId === driver.id);
            const shiftMap = {};
            driverShifts.forEach(shift => {
                const backupInfo = backupMap.get(`${shift.date}_${driver.id}`);
                shiftMap[shift.date] = {
                    status: shift.status,
                    backupAssigned: !!backupInfo,
                    backupDriverId: backupInfo?.backupDriverId,
                    backupDriverName: backupInfo?.backupDriverName
                };
            });
            return {
                driverId: driver.id,
                driverName: driver.name,
                routeNumber: driver.routeNumber,
                contractType: driver.contractType,
                shifts: shiftMap
            };
        });
        return gridRows;
    }
    updateCellStatus(driverId, date, status) {
        const driver = driverRepository_1.driverRepository.findById(driverId);
        if (!driver)
            throw new Error('기사 정보를 찾을 수 없습니다.');
        const shift = scheduleRepository_1.scheduleRepository.upsertShift(driverId, date, status);
        // If status changed from '휴무' to something else, clear backup assignment if any
        if (status !== '휴무') {
            backupRepository_1.backupRepository.removeAssignment(date, driver.routeNumber);
        }
        return shift;
    }
    getOffDaySummary(startDate, endDate) {
        const offDayShifts = scheduleRepository_1.scheduleRepository.getOffDays(startDate, endDate);
        const drivers = driverRepository_1.driverRepository.findAll();
        const backupAssignments = backupRepository_1.backupRepository.findAll();
        const driverMap = new Map(drivers.map(d => [d.id, d]));
        const backupMap = new Map(backupAssignments.map(b => [`${b.date}_${b.originalDriverId}`, b]));
        return offDayShifts.map(shift => {
            const driver = driverMap.get(shift.driverId);
            const backup = backupMap.get(`${shift.date}_${shift.driverId}`);
            return {
                id: shift.id,
                driverId: shift.driverId,
                driverName: driver ? driver.name : '미상',
                routeNumber: driver ? driver.routeNumber : '-',
                date: shift.date,
                backupAssigned: !!backup,
                backupDriverId: backup?.backupDriverId,
                backupDriverName: backup?.backupDriverName
            };
        });
    }
}
exports.scheduleService = new ScheduleService();
