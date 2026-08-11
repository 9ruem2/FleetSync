"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.backupRepository = void 0;
const mockData_1 = require("../database/mockData");
const driverRepository_1 = require("./driverRepository");
class BackupRepository {
    assignments = [...mockData_1.initialBackupAssignments];
    findAll() {
        return this.assignments;
    }
    findByDateAndRoute(date, routeNumber) {
        return this.assignments.find(a => a.date === date && a.routeNumber === routeNumber);
    }
    findByDate(date) {
        return this.assignments.filter(a => a.date === date);
    }
    assignBackup(dto) {
        const originalDriver = driverRepository_1.driverRepository.findById(dto.originalDriverId);
        const backupDriver = driverRepository_1.driverRepository.findById(dto.backupDriverId);
        if (!originalDriver || !backupDriver) {
            return null;
        }
        // Remove existing assignment if any for that date & route
        this.assignments = this.assignments.filter(a => !(a.date === dto.date && a.routeNumber === dto.routeNumber));
        const newAssignment = {
            id: `bak-${Date.now()}`,
            date: dto.date,
            routeNumber: dto.routeNumber,
            originalDriverId: originalDriver.id,
            originalDriverName: originalDriver.name,
            backupDriverId: backupDriver.id,
            backupDriverName: backupDriver.name,
            note: dto.note || '수동 지정 완료',
            createdAt: new Date().toISOString()
        };
        this.assignments.push(newAssignment);
        return newAssignment;
    }
    removeAssignment(date, routeNumber) {
        const initialLen = this.assignments.length;
        this.assignments = this.assignments.filter(a => !(a.date === date && a.routeNumber === routeNumber));
        return this.assignments.length < initialLen;
    }
}
exports.backupRepository = new BackupRepository();
