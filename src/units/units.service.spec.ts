import { Test, TestingModule } from '@nestjs/testing';
import { UnitsService } from './units.service';

import { UNITS } from './entities/units';

describe('UnitsService', () => {
  let service: UnitsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UnitsService],
    }).compile();

    service = module.get<UnitsService>(UnitsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should find a unit', () => {
    const unit = service.findOne(UNITS['unit-claude'].id);

    expect(unit).toEqual(UNITS['unit-claude']);
  });

  it("should thrown an error when don't find a unit", () => {
    expect(() => {
      service.findOne('error');
    }).toThrow('Unit not found');
  });
});
