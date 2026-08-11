import { Driver, CreateDriverDTO, UpdateDriverDTO } from '../types';
import { initialDrivers } from '../database/mockData';

class DriverRepository {
  private drivers: Driver[] = [...initialDrivers];

  public findAll(includeDeleted = false): Driver[] {
    if (includeDeleted) return this.drivers;
    return this.drivers.filter(d => !d.isDeleted);
  }

  public findById(id: string): Driver | undefined {
    return this.drivers.find(d => d.id === id && !d.isDeleted);
  }

  public create(dto: CreateDriverDTO): Driver {
    const newDriver: Driver = {
      id: `drv-${Date.now()}`,
      name: dto.name,
      phone: dto.phone,
      routeNumber: dto.routeNumber,
      contractType: dto.contractType,
      createdAt: new Date().toISOString(),
      isDeleted: false
    };
    this.drivers.push(newDriver);
    return newDriver;
  }

  public update(id: string, dto: UpdateDriverDTO): Driver | null {
    const index = this.drivers.findIndex(d => d.id === id && !d.isDeleted);
    if (index === -1) return null;

    const existing = this.drivers[index];
    const updated: Driver = {
      ...existing,
      name: dto.name !== undefined ? dto.name : existing.name,
      phone: dto.phone !== undefined ? dto.phone : existing.phone,
      routeNumber: dto.routeNumber !== undefined ? dto.routeNumber : existing.routeNumber,
      contractType: dto.contractType !== undefined ? dto.contractType : existing.contractType
    };

    this.drivers[index] = updated;
    return updated;
  }

  public softDelete(id: string): boolean {
    const index = this.drivers.findIndex(d => d.id === id && !d.isDeleted);
    if (index === -1) return false;
    this.drivers[index].isDeleted = true;
    return true;
  }
}

export const driverRepository = new DriverRepository();
