import { Injectable, NotFoundException } from '@nestjs/common';
import { UNITS } from './entities/units';

@Injectable()
export class UnitsService {
  findAll() {
    return UNITS;
  }

  findOne(id: string) {
    const unit = UNITS[id];

    if (!unit) throw new NotFoundException('Unit not found');

    return unit;
  }
}
