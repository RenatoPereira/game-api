import { Unit } from './unit.entity';

export const UNITS: { [key: string]: Unit } = {
  'unit-claude': {
    id: 'unit-claude',
    leader: true,
    class: 'Human',
    name: 'Claude',
    price: Infinity,
    health: 25,
    attack: 7,
    defense: 3,
    movement: 4,
    range: 1,
    assets: {
      splash:
        'https://res.cloudinary.com/dyfphd7ir/image/upload/v1749122919/splash_eqxpzl.png',
      sprite:
        'https://res.cloudinary.com/dyfphd7ir/image/upload/v1749122918/sprite_wvyjiq.png',
      full: 'https://res.cloudinary.com/dyfphd7ir/image/upload/v1749122920/full_srwpsf.png',
    },
  },
  'unit-rena': {
    id: 'unit-rena',
    leader: true,
    class: 'Human',
    name: 'Rena',
    price: Infinity,
    health: 25,
    attack: 6,
    defense: 3,
    movement: 4,
    range: 3,
    assets: {
      splash:
        'https://res.cloudinary.com/dyfphd7ir/image/upload/v1749122918/splash_qtter2.png',
      sprite:
        'https://res.cloudinary.com/dyfphd7ir/image/upload/v1749122918/sprite_h4ix3s.png',
      full: 'https://res.cloudinary.com/dyfphd7ir/image/upload/v1749122920/full_q7ht56.png',
    },
  },
  'unit-celine': {
    id: 'unit-celine',
    leader: true,
    class: 'Human',
    name: 'Celine',
    price: Infinity,
    health: 20,
    attack: 7,
    defense: 3,
    movement: 4,
    range: 3,
    assets: {
      splash:
        'https://res.cloudinary.com/dyfphd7ir/image/upload/v1749122918/splash_bwsqge.png',
      sprite:
        'https://res.cloudinary.com/dyfphd7ir/image/upload/v1749122917/sprite_vlcuno.png',
      full: 'https://res.cloudinary.com/dyfphd7ir/image/upload/v1749122919/full_kj5s37.png',
    },
  },
  'unit-ashton': {
    id: 'unit-ashton',
    leader: true,
    class: 'Human',
    name: 'Ashton',
    price: Infinity,
    health: 18,
    attack: 8,
    defense: 2,
    movement: 5,
    range: 1,
    assets: {
      splash:
        'https://res.cloudinary.com/dyfphd7ir/image/upload/v1749122918/splash_mkcql6.png',
      sprite:
        'https://res.cloudinary.com/dyfphd7ir/image/upload/v1749122918/sprite_i6gimd.png',
      full: 'https://res.cloudinary.com/dyfphd7ir/image/upload/v1749122918/full_qlkvdm.png',
    },
  },
  'unit-precis': {
    id: 'unit-precis',
    leader: true,
    class: 'Human',
    name: 'Precis',
    price: Infinity,
    health: 35,
    attack: 3,
    defense: 7,
    movement: 3,
    range: 1,
    assets: {
      splash:
        'https://res.cloudinary.com/dyfphd7ir/image/upload/v1749122919/splash_djrcm1.png',
      sprite:
        'https://res.cloudinary.com/dyfphd7ir/image/upload/v1749122917/sprite_vd78pq.png',
      full: 'https://res.cloudinary.com/dyfphd7ir/image/upload/v1749122918/full_lapqdv.png',
    },
  },
};
