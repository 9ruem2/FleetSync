"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.backupService = void 0;
const backupRepository_1 = require("../repositories/backupRepository");
const driverRepository_1 = require("../repositories/driverRepository");
const scheduleRepository_1 = require("../repositories/scheduleRepository");
class BackupService {
    getAllAssignments() {
        return backupRepository_1.backupRepository.findAll();
    }
    getAvailableBackupDrivers(date) {
        const drivers = driverRepository_1.driverRepository.findAll();
        const shiftsOnDate = scheduleRepository_1.scheduleRepository.findShifts(date, date);
        // Find drivers who are marked as '휴무' on that date
        const offDriverIds = new Set(shiftsOnDate.filter(s => s.status === '휴무').map(s => s.driverId));
        // Eligible backup drivers:
        // 1. Contract type is '백업' OR available drivers
        // 2. Not marked as '휴무' on that date
        return drivers.filter(d => !offDriverIds.has(d.id));
    }
    assignBackup(dto) {
        if (!dto.date || !dto.routeNumber || !dto.originalDriverId || !dto.backupDriverId) {
            throw new Error('필수 정보가 누락되었습니다 (날짜, 라우트, 기존기사, 백업기사)');
        }
        const assignment = backupRepository_1.backupRepository.assignBackup(dto);
        if (!assignment) {
            throw new Error('대차 지정에 실패했습니다.');
        }
        return assignment;
    }
}
exports.backupService = new BackupService();
