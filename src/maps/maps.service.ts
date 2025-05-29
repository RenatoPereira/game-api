import { BadRequestException, Injectable } from '@nestjs/common';
import { MapTable } from './entities/map.entity';
import { Grid, AxialCoordinates, rectangle, ring } from 'honeycomb-grid';
import { Tile } from './entities/tile.entity';
import { GameStateUnit } from '../games-state/interfaces/game-state.interface';
import { aStar } from 'abstract-astar'
import { getUnitKey } from '../libs/tile.utils';

@Injectable()
export class MapsService {
  create(): MapTable {
    const map = new MapTable();

    map.height = 12;
    map.width = 20;
    map.grid = new Grid(Tile, rectangle({ width: map.width, height: map.height }))

    return map;
  }

  private populateMap = (map: MapTable, units: Map<string, GameStateUnit>) => {
    return map.grid.forEach((tile) => {
      const unit = units.get(getUnitKey(tile));

      if (unit) {
        tile.setUnit(unit);
      }
    })
  }

  distanceToTravel(map: MapTable, units: Map<string, GameStateUnit>, from: AxialCoordinates, to: AxialCoordinates): number {
    const populatedMap = this.populateMap(map, units)

    const fromTile = populatedMap.getHex(from);
    const toTile = populatedMap.getHex(to);

    console.log({ from, fromTile, to, toTile })

    if (!fromTile || !toTile) 
      throw new BadRequestException('Tile not found');

    if (!fromTile.isOccupied())
      throw new BadRequestException('From Tile is not occupied');

    if (toTile.isOccupied())
      throw new BadRequestException('To Tile is not occupied');

    const path = this.shortestPath(map, fromTile, toTile);

    if (!path)
      throw new BadRequestException('No path found');

    const distanceToTravel = path.length - 1

    if (distanceToTravel > fromTile.getUnit()?.state.distanceCanMove!)
      throw new BadRequestException('No movement enough');

    return distanceToTravel;
  }

  canAtack(map: MapTable, units: Map<string, GameStateUnit>, from: AxialCoordinates, to: AxialCoordinates): boolean {
    const populatedMap = this.populateMap(map, units)

    const fromTile = populatedMap.getHex(from);
    const toTile = populatedMap.getHex(to);

    if (!fromTile || !toTile) 
      throw new BadRequestException('Tile not found');

    if (!fromTile.isOccupied())
      throw new BadRequestException('From Tile is not occupied');

    if (!toTile.isOccupied())
      throw new BadRequestException('To Tile is not occupied');

    const path = this.shortestPath(map, fromTile, toTile);

    if (!path)
      throw new BadRequestException('No path found');

    const distanceToAtack = path.length - 1

    return distanceToAtack >= fromTile.getUnit()?.unit.range!
  }

  private shortestPath(map: MapTable, from: Tile, to: Tile): Tile[] | undefined {
    return aStar<Tile>({
      start: from,
      goal: to,
      estimateFromNodeToGoal: (tile) => map.grid.distance(tile, to),
      neighborsAdjacentToNode: (center) => map.grid.traverse(ring({ radius: 1, center })).toArray(),
      actualCostToMove: (_, __, tile) => tile.isOccupied() && !tile.equals(to) ? Infinity : 1,
    })
  }

  getEnablePositionAroundLeader(map: MapTable, units: Map<string, GameStateUnit>, position: AxialCoordinates): AxialCoordinates {
    const positions = map.grid.traverse(ring({ radius: 1, center: position })).toArray();

    const enablePositions = positions.filter((tile) => units.get(getUnitKey(tile)) === undefined);

    if (enablePositions.length === 0)
      throw new BadRequestException('No enable position found');

    return { q: enablePositions[0].q, r: enablePositions[0].r };
  }
}
