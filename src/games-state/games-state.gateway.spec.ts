import { Test, TestingModule } from '@nestjs/testing';
import { GamesStateGateway } from './games-state.gateway';
import { GamesStateService } from './games-state.service';

describe('GamesStateGateway', () => {
  let gateway: GamesStateGateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GamesStateGateway, GamesStateService],
    }).compile();

    gateway = module.get<GamesStateGateway>(GamesStateGateway);
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });
});
