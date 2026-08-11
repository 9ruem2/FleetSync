"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BackupController = void 0;
const backupService_1 = require("../services/backupService");
class BackupController {
    static getAllAssignments(_req, res) {
        try {
            const assignments = backupService_1.backupService.getAllAssignments();
            res.status(200).json({ success: true, data: assignments });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    static getCandidates(req, res) {
        try {
            const { date } = req.query;
            if (!date) {
                res.status(400).json({ success: false, message: '조회 기준 날짜(date)가 필요합니다' });
                return;
            }
            const candidates = backupService_1.backupService.getAvailableBackupDrivers(date);
            res.status(200).json({ success: true, data: candidates });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    static assignBackup(req, res) {
        try {
            const assignment = backupService_1.backupService.assignBackup(req.body);
            res.status(201).json({ success: true, data: assignment, message: '대차 기사가 지정되었습니다' });
        }
        catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }
}
exports.BackupController = BackupController;
