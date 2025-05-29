import { Module } from '@nestjs/common';
import { MatchsService } from './matchs.service';
import { MatchsGateway } from './matchs.gateway';
import { DatabasesModule } from '../databases/databases.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Match } from './entities/match.entity';
import { GamesStateService } from '../games-state/games-state.service';
import { MapsService } from '../maps/maps.service';
import { CombatService } from 'src/combat/combat.service';

@Module({
  providers: [MatchsGateway, MatchsService, GamesStateService, MapsService, CombatService],
  imports: [DatabasesModule, TypeOrmModule.forFeature([Match])]
})
export class MatchsModule {}
