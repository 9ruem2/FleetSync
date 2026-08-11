import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { DriverController } from './controllers/driverController';
import { ScheduleController } from './controllers/scheduleController';
import { BackupController } from './controllers/backupController';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Routes
// 1. Driver Management [F-01]
app.get('/api/drivers', DriverController.getDrivers);
app.get('/api/drivers/:id', DriverController.getDriverById);
app.post('/api/drivers', DriverController.createDriver);
app.put('/api/drivers/:id', DriverController.updateDriver);
app.delete('/api/drivers/:id', DriverController.deleteDriver);

// 2. Schedule Grid & Off-days [F-02-1, F-02-2]
app.get('/api/schedules/grid', ScheduleController.getGrid);
app.put('/api/schedules/cell', ScheduleController.updateCell);
app.get('/api/schedules/offdays', ScheduleController.getOffDays);

// 3. Backup Matching [F-02-3]
app.get('/api/backups', BackupController.getAllAssignments);
app.get('/api/backups/candidates', BackupController.getCandidates);
app.post('/api/backups/assign', BackupController.assignBackup);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', system: 'Coupang Fleet Sync API', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`[FleetSync Backend] Server running on http://localhost:${PORT}`);
});
