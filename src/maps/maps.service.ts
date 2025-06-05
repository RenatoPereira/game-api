import { BadRequestException, Injectable } from '@nestjs/common';
import { MapTable } from './entities/map.entity';
import { Grid, AxialCoordinates, rectangle, ring } from 'honeycomb-grid';
import { Tile } from './entities/tile.entity';
import { GameStateUnit } from '../games-state/interfaces/game-state.interface';
import { aStar } from 'abstract-astar';
import { getUnitKey } from '../libs/tile.utils';

@Injectable()
export class MapsService {
  create(height = 12, width = 20): MapTable {
    const map = new MapTable();

    map.height = height;
    map.width = width;

    return map;
  }

  populateMap = (
    map: MapTable,
    units: Map<string, GameStateUnit>,
  ): Grid<Tile> => {
    const grid = new Grid(
      Tile,
      rectangle({ width: map.width, height: map.height }),
    );

    grid?.forEach((tile) => {
      const unit = units.get(getUnitKey(tile));

      if (unit) {
        tile.setUnit(unit);
      }
    });

    return grid;
  };

  getDistanceToIfCanTravel(
    grid: Grid<Tile>,
    from: AxialCoordinates,
    to: AxialCoordinates,
  ): number {
    const fromTile = grid.getHex(from);
    const toTile = grid.getHex(to);

    if (!fromTile || !toTile) throw new BadRequestException('Tile not found');

    if (!fromTile.isOccupied())
      throw new BadRequestException('From Tile is not occupied');

    if (toTile.isOccupied())
      throw new BadRequestException('To Tile is occupied');

    const path = this.shortestPath(grid, fromTile, toTile);

    if (!path) throw new BadRequestException('No path found');

    const distanceToTravel = path.length - 1;

    if (distanceToTravel > fromTile.getUnit()?.state.distanceCanMove!)
      throw new BadRequestException('No movement enough');

    return distanceToTravel;
  }

  canAtack(
    grid: Grid<Tile>,
    from: AxialCoordinates,
    to: AxialCoordinates,
  ): boolean {
    const fromTile = grid.getHex(from);
    const toTile = grid.getHex(to);

    if (!fromTile || !toTile) throw new BadRequestException('Tile not found');

    if (!fromTile.isOccupied())
      throw new BadRequestException('From Tile is not occupied');

    if (!toTile.isOccupied())
      throw new BadRequestException('To Tile is not occupied');

    const path = this.shortestPath(grid, fromTile, toTile);

    if (!path) throw new BadRequestException('No path found');

    const distanceToAtack = path.length - 1;

    return (
      fromTile.getUnit()?.state.canAttack! &&
      distanceToAtack <= fromTile.getUnit()?.unit.range!
    );
  }

  private shortestPath(
    grid: Grid<Tile>,
    from: Tile,
    to: Tile,
  ): Tile[] | undefined {
    return aStar<Tile>({
      start: from,
      goal: to,
      estimateFromNodeToGoal: (tile) => grid.distance(tile, to),
      neighborsAdjacentToNode: (center) =>
        grid.traverse(ring({ radius: 1, center })).toArray(),
      actualCostToMove: (_, __, tile) =>
        tile.isOccupied() && !tile.equals(to) ? Infinity : 1,
    });
  }

  getEnablePositionAround(
    grid: Grid<Tile>,
    position: AxialCoordinates,
  ): AxialCoordinates {
    const positions = grid
      .traverse(ring({ radius: 1, center: position }))
      .toArray();

    const firstEnablePosition = positions.find((tile) => !tile.isOccupied());

    if (!firstEnablePosition)
      throw new BadRequestException('No enable position found');

    return firstEnablePosition;
  }
}
