import { Module } from '@nestjs/common';
import { GamesStateService } from './games-state.service';
import { GamesStateGateway } from './games-state.gateway';

@Module({
  providers: [GamesStateGateway, GamesStateService],
})
export class GamesStateModule {}
