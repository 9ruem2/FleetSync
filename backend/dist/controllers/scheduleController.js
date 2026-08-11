"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScheduleController = void 0;
const scheduleService_1 = require("../services/scheduleService");
class ScheduleController {
    static getGrid(req, res) {
        try {
            const { startDate, endDate } = req.query;
            if (!startDate || !endDate) {
                res.status(400).json({ success: false, message: 'startDate와 endDate 조회가 필요합니다' });
                return;
            }
            const grid = scheduleService_1.scheduleService.getScheduleGrid(startDate, endDate);
            res.status(200).json({ success: true, data: grid });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    static updateCell(req, res) {
        try {
            const { driverId, date, status } = req.body;
            if (!driverId || !date || !status) {
                res.status(400).json({ success: false, message: 'driverId, date, status 정보가 필수입니다' });
                return;
            }
            const shift = scheduleService_1.scheduleService.updateCellStatus(driverId, date, status);
            res.status(200).json({ success: true, data: shift, message: '근무 상태가 수정되었습니다' });
        }
        catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }
    static getOffDays(req, res) {
        try {
            const { startDate, endDate } = req.query;
            const offDays = scheduleService_1.scheduleService.getOffDaySummary(startDate, endDate);
            res.status(200).json({ success: true, data: offDays });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
}
exports.ScheduleController = ScheduleController;
