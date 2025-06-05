export const UNIT_1 = {
  id: 'unit-1',
  leader: true,
  class: 'human',
  name: 'Attacker',
  price: Infinity,
  health: 25,
  attack: 8,
  defense: 5,
  range: 1,
  movement: 4,
  assets: {},
};

export const UNIT_2 = {
  id: 'unit-2',
  leader: true,
  class: 'human',
  name: 'Defender',
  price: Infinity,
  health: 25,
  attack: 8,
  defense: 5,
  range: 1,
  movement: 4,
  assets: {},
};

export const ATTACKER_UNIT = {
  id: 'attacker',
  unit: UNIT_1,
  state: {
    playerId: 'player',
    health: 25,
    experience: 0,
    level: 1,
    distanceCanMove: 4,
    position: {
      q: 0,
      r: 0,
    },
    canAttack: true,
  },
};

export const DEFENDER_UNIT = {
  id: 'defender',
  unit: UNIT_2,
  state: {
    playerId: 'enemy',
    health: 25,
    experience: 0,
    level: 1,
    distanceCanMove: 4,
    position: {
      q: 0,
      r: 1,
    },
    canAttack: true,
  },
};
