import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MatchsModule } from './matchs/matchs.module';
import { DatabasesModule } from './databases/databases.module';
import { PlayersModule } from './players/players.module';
import { GamesStateModule } from './games-state/games-state.module';
import { MapsModule } from './maps/maps.module';
import { UnitsModule } from './units/units.module';

@Module({
  imports: [MatchsModule, DatabasesModule, PlayersModule, GamesStateModule, MapsModule, UnitsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
