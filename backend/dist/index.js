"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const driverController_1 = require("./controllers/driverController");
const scheduleController_1 = require("./controllers/scheduleController");
const backupController_1 = require("./controllers/backupController");
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 4000;
app.use((0, cors_1.default)({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express_1.default.json());
// Routes
// 1. Driver Management [F-01]
app.get('/api/drivers', driverController_1.DriverController.getDrivers);
app.get('/api/drivers/:id', driverController_1.DriverController.getDriverById);
app.post('/api/drivers', driverController_1.DriverController.createDriver);
app.put('/api/drivers/:id', driverController_1.DriverController.updateDriver);
app.delete('/api/drivers/:id', driverController_1.DriverController.deleteDriver);
// 2. Schedule Grid & Off-days [F-02-1, F-02-2]
app.get('/api/schedules/grid', scheduleController_1.ScheduleController.getGrid);
app.put('/api/schedules/cell', scheduleController_1.ScheduleController.updateCell);
app.get('/api/schedules/offdays', scheduleController_1.ScheduleController.getOffDays);
// 3. Backup Matching [F-02-3]
app.get('/api/backups', backupController_1.BackupController.getAllAssignments);
app.get('/api/backups/candidates', backupController_1.BackupController.getCandidates);
app.post('/api/backups/assign', backupController_1.BackupController.assignBackup);
// Health check
app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', system: 'Coupang Fleet Sync API', timestamp: new Date().toISOString() });
});
app.listen(PORT, () => {
    console.log(`[FleetSync Backend] Server running on http://localhost:${PORT}`);
});
