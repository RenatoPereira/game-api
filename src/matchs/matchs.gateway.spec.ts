import { Test, TestingModule } from '@nestjs/testing';
import { MatchsGateway } from './matchs.gateway';
import { MatchsService } from './matchs.service';
import { Match } from './entities/match.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DatabasesModule } from '../databases/databases.module';
import { GamesStateService } from '../games-state/games-state.service';
import { MapsService } from '../maps/maps.service';
import { CombatService } from 'src/combat/combat.service';

describe('MatchsGateway', () => {
  let gateway: MatchsGateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MatchsGateway, MatchsService, GamesStateService, MapsService, CombatService],
      imports: [DatabasesModule, TypeOrmModule.forFeature([Match])]
    }).compile();

    gateway = module.get<MatchsGateway>(MatchsGateway);
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });
});
