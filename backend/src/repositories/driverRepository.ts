import { Driver, CreateDriverDTO, UpdateDriverDTO } from '../types';
import { readJsonFile, writeJsonFile, hasData } from '../database/jsonStore';
import { initialDrivers } from '../database/mockData';

const FILE_NAME = 'drivers.json';

class DriverRepository {
  constructor() {
    this.seedIfEmpty();
  }

  /** 최초 실행 시 JSON 파일이 비어있으면 시드 데이터 주입 */
  private seedIfEmpty(): void {
    if (!hasData(FILE_NAME)) {
      writeJsonFile<Driver>(FILE_NAME, initialDrivers);
      console.log('[DriverRepo] 시드 데이터 주입 완료 → drivers.json');
    }
  }

  private load(): Driver[] {
    return readJsonFile<Driver>(FILE_NAME);
  }

  private save(drivers: Driver[]): void {
    writeJsonFile<Driver>(FILE_NAME, drivers);
  }

  public findAll(includeDeleted = false): Driver[] {
    const drivers = this.load();
    if (includeDeleted) return drivers;
    return drivers.filter(d => !d.isDeleted);
  }

  public findById(id: string): Driver | undefined {
    const drivers = this.load();
    return drivers.find(d => d.id === id && !d.isDeleted);
  }

  public create(dto: CreateDriverDTO): Driver {
    const drivers = this.load();
    const newDriver: Driver = {
      id: `drv-${Date.now()}`,
      name: dto.name,
      phone: dto.phone,
      routeNumber: dto.routeNumber,
      contractType: dto.contractType,
      createdAt: new Date().toISOString(),
      isDeleted: false
    };
    drivers.push(newDriver);
    this.save(drivers);
    return newDriver;
  }

  public update(id: string, dto: UpdateDriverDTO): Driver | null {
    const drivers = this.load();
    const index = drivers.findIndex(d => d.id === id && !d.isDeleted);
    if (index === -1) return null;

    const existing = drivers[index];
    const updated: Driver = {
      ...existing,
      name: dto.name !== undefined ? dto.name : existing.name,
      phone: dto.phone !== undefined ? dto.phone : existing.phone,
      routeNumber: dto.routeNumber !== undefined ? dto.routeNumber : existing.routeNumber,
      contractType: dto.contractType !== undefined ? dto.contractType : existing.contractType
    };

    drivers[index] = updated;
    this.save(drivers);
    return updated;
  }

  public softDelete(id: string): boolean {
    const drivers = this.load();
    const index = drivers.findIndex(d => d.id === id && !d.isDeleted);
    if (index === -1) return false;
    drivers[index].isDeleted = true;
    this.save(drivers);
    return true;
  }
}

export const driverRepository = new DriverRepository();
