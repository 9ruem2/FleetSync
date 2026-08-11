"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DriverController = void 0;
const driverService_1 = require("../services/driverService");
class DriverController {
    static getDrivers(req, res) {
        try {
            const { search, route, contractType } = req.query;
            const drivers = driverService_1.driverService.getAllDrivers(search, route, contractType);
            res.status(200).json({ success: true, data: drivers });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    static getDriverById(req, res) {
        try {
            const { id } = req.params;
            const driver = driverService_1.driverService.getDriverById(id);
            if (!driver) {
                res.status(404).json({ success: false, message: '기사를 찾을 수 없습니다' });
                return;
            }
            res.status(200).json({ success: true, data: driver });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    static createDriver(req, res) {
        try {
            const newDriver = driverService_1.driverService.createDriver(req.body);
            res.status(201).json({ success: true, data: newDriver, message: '기사가 신규 등록되었습니다' });
        }
        catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }
    static updateDriver(req, res) {
        try {
            const { id } = req.params;
            const updated = driverService_1.driverService.updateDriver(id, req.body);
            res.status(200).json({ success: true, data: updated, message: '기사 정보가 수정되었습니다' });
        }
        catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }
    static deleteDriver(req, res) {
        try {
            const { id } = req.params;
            driverService_1.driverService.deleteDriver(id);
            res.status(200).json({ success: true, message: '기사 정보가 소프트 삭제 처리되었습니다' });
        }
        catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }
}
exports.DriverController = DriverController;
