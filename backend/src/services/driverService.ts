import { driverRepository } from '../repositories/driverRepository';
import { CreateDriverDTO, UpdateDriverDTO, Driver } from '../types';

class DriverService {
  public getAllDrivers(search?: string, route?: string, contractType?: string): Driver[] {
    let drivers = driverRepository.findAll();

    if (search && search.trim() !== '') {
      const q = search.trim().toLowerCase();
      drivers = drivers.filter(d => 
        d.name.toLowerCase().includes(q) || 
        d.routeNumber.toLowerCase().includes(q) ||
        d.phone.includes(q)
      );
    }

    if (route && route.trim() !== '') {
      drivers = drivers.filter(d => d.routeNumber === route.trim());
    }

    if (contractType && contractType.trim() !== '') {
      drivers = drivers.filter(d => d.contractType === contractType.trim());
    }

    return drivers;
  }

  public getDriverById(id: string): Driver | null {
    return driverRepository.findById(id) || null;
  }

  public createDriver(dto: CreateDriverDTO): Driver {
    if (!dto.name || !dto.phone || !dto.routeNumber || !dto.contractType) {
      throw new Error('필수 입력값이 누락되었습니다 (기사명, 연락처, 라우트번호, 계약형태)');
    }
    return driverRepository.create(dto);
  }

  public updateDriver(id: string, dto: UpdateDriverDTO): Driver {
    const updated = driverRepository.update(id, dto);
    if (!updated) {
      throw new Error('해당 기사를 찾을 수 없거나 이미 삭제되었습니다');
    }
    return updated;
  }

  public deleteDriver(id: string): boolean {
    const success = driverRepository.softDelete(id);
    if (!success) {
      throw new Error('기사 삭제에 실패했습니다');
    }
    return true;
  }
}

export const driverService = new DriverService();
