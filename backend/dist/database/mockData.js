"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initialBackupAssignments = exports.initialDrivers = void 0;
exports.generateSeedShifts = generateSeedShifts;
exports.initialDrivers = [
    {
        id: 'drv-1',
        name: '홍길동',
        phone: '010-1234-5678',
        routeNumber: '101A',
        contractType: '고정',
        createdAt: '2026-01-10T09:00:00Z',
        isDeleted: false
    },
    {
        id: 'drv-2',
        name: '김철수',
        phone: '010-2345-6789',
        routeNumber: '102B',
        contractType: '고정',
        createdAt: '2026-01-12T09:00:00Z',
        isDeleted: false
    },
    {
        id: 'drv-3',
        name: '이영희',
        phone: '010-3456-7890',
        routeNumber: '103C',
        contractType: '용차',
        createdAt: '2026-02-01T09:00:00Z',
        isDeleted: false
    },
    {
        id: 'drv-4',
        name: '박백업',
        phone: '010-4567-8901',
        routeNumber: 'BACKUP-1',
        contractType: '백업',
        createdAt: '2026-02-15T09:00:00Z',
        isDeleted: false
    },
    {
        id: 'drv-5',
        name: '최대차',
        phone: '010-5678-9012',
        routeNumber: 'BACKUP-2',
        contractType: '백업',
        createdAt: '2026-03-01T09:00:00Z',
        isDeleted: false
    },
    {
        id: 'drv-6',
        name: '정용차',
        phone: '010-6789-0123',
        routeNumber: '104D',
        contractType: '용차',
        createdAt: '2026-03-10T09:00:00Z',
        isDeleted: false
    },
    {
        id: 'drv-7',
        name: '강고정',
        phone: '010-7890-1234',
        routeNumber: '105E',
        contractType: '고정',
        createdAt: '2026-04-05T09:00:00Z',
        isDeleted: false
    },
    {
        id: 'drv-8',
        name: '윤백업',
        phone: '010-8901-2345',
        routeNumber: 'BACKUP-3',
        contractType: '백업',
        createdAt: '2026-04-12T09:00:00Z',
        isDeleted: false
    }
];
// Helper to generate seed shifts for August 2026
function generateSeedShifts(drivers) {
    const shifts = [];
    const year = 2026;
    const month = 7; // 0-indexed for August (August = 7)
    // Dates for current month
    for (let day = 1; day <= 31; day++) {
        const dayStr = day < 10 ? `0${day}` : `${day}`;
        const dateStr = `${year}-08-${dayStr}`;
        drivers.forEach((driver) => {
            // Default shift status based on contract type
            let status = driver.contractType;
            // Add a few realistic off-days (휴무)
            if ((driver.id === 'drv-1' && (day === 12 || day === 18)) ||
                (driver.id === 'drv-2' && (day === 13 || day === 25)) ||
                (driver.id === 'drv-7' && (day === 15 || day === 20))) {
                status = '휴무';
            }
            shifts.push({
                id: `shift-${driver.id}-${dateStr}`,
                driverId: driver.id,
                date: dateStr,
                status
            });
        });
    }
    return shifts;
}
exports.initialBackupAssignments = [
    {
        id: 'bak-1',
        date: '2026-08-12',
        routeNumber: '101A',
        originalDriverId: 'drv-1',
        originalDriverName: '홍길동',
        backupDriverId: 'drv-4',
        backupDriverName: '박백업',
        note: '수동 지정 완료 (야간 백업)',
        createdAt: '2026-08-11T10:00:00Z'
    }
];
