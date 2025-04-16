// src/utils/itemData.ts
import { Item } from '@/src/types'; // Alias

const ITEM_SPRITE_URL_BASE =
  'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/';

export const ITEMS_DB: { [key: string]: Item } = {
  // === Poké Balls ===
  pokeball: {
    /* ... */ id: 'pokeball',
    name: 'Poké Ball',
    category: 'pokeball',
    sprite: {uri: `${ITEM_SPRITE_URL_BASE}poke-ball.png`},
    findDifficulty: 0.9,
    description: 'Un dispositivo para capturar Pokémon salvajes.',
  },
  greatball: {
    /* ... */ id: 'greatball',
    name: 'Great Ball',
    category: 'pokeball',
    sprite: {uri: `${ITEM_SPRITE_URL_BASE}great-ball.png`},
    findDifficulty: 0.7,
    description: 'Una Poké Ball con mayor tasa de éxito que la estándar.',
  },
  ultraball: {
    /* ... */ id: 'ultraball',
    name: 'Ultra Ball',
    category: 'pokeball',
    sprite: {uri: `${ITEM_SPRITE_URL_BASE}ultra-ball.png`},
    findDifficulty: 0.65,
    description: 'Una Poké Ball con una tasa de éxito superior.',
  },
  masterball: {
    /* ... */ id: 'masterball',
    name: 'Master Ball',
    category: 'pokeball',
    sprite: {uri: `${ITEM_SPRITE_URL_BASE}master-ball.png`},
    findDifficulty: 0.01,
    description: 'La mejor Poké Ball. Captura cualquier Pokémon sin fallar.',
  },

  // === Bayas ===
  'razz-berry': {
    /* ... */ id: 'razz-berry',
    name: 'Razz Berry',
    category: 'berry',
    sprite: {uri: `${ITEM_SPRITE_URL_BASE}razz-berry.png`},
    findDifficulty: 0.75,
    description: 'Alimenta a un Pokémon para que sea más fácil de atrapar.',
    effect: { catchRateModifier: 1.5 },
  },
  'nanab-berry': {
    /* ... */ id: 'nanab-berry',
    name: 'Nanab Berry',
    category: 'berry',
    sprite: {uri: `${ITEM_SPRITE_URL_BASE}nanab-berry.png`},
    findDifficulty: 0.75,
    description: 'Calma a un Pokémon, haciendo que deje de moverse.',
  },
  'golden-razz-berry': {
    /* ... */ id: 'golden-razz-berry',
    name: 'Golden Razz Berry',
    category: 'berry',
    sprite: {uri: `https://archives.bulbagarden.net/media/upload/7/7e/Bag_Golden_Razz_Berry_Sprite.png`},
    findDifficulty: 0.55,
    description: 'Aumenta drásticamente la facilidad de captura.',
    effect: { catchRateModifier: 2.5 },
  },

  // === Key Items ===
  'shiny-charm': {
    /* ... */ id: 'shiny-charm',
    name: 'Shiny Charm',
    category: 'key',
    sprite: {uri: `${ITEM_SPRITE_URL_BASE}shiny-charm.png`},
    findDifficulty: 0.04,
    description: 'Aumenta la probabilidad de encontrar Pokémon Shiny.',
    effect: { shinyRateMultiplier: 3 },
  },

  // === Otros Items ===
  potion: {
    /* ... */ id: 'potion',
    name: 'Potion',
    category: 'medicine',
    sprite: {uri:`${ITEM_SPRITE_URL_BASE}potion.png`},
    findDifficulty: 0.7,
    description: 'Restaura 20 PS de un Pokémon.',
  },
  revive: {
    /* ... */ id: 'revive',
    name: 'Revive',
    category: 'medicine',
    sprite: {uri: `${ITEM_SPRITE_URL_BASE}revive.png`},
    findDifficulty: 0.5,
    description: 'Revive a un Pokémon debilitado.',
  },

  // <-- AÑADIR LUCKY EGG -->
  'lucky-egg': {
    id: 'lucky-egg',
    name: 'Lucky Egg',
    category: 'other', // O 'held' si hubiera mecánica de equipar
    sprite: {uri: `${ITEM_SPRITE_URL_BASE}lucky-egg.png`},
    findDifficulty: 0.2, // Bastante raro
    description:
      'Un huevo que otorga felicidad y duplica la XP ganada al capturar Pokémon.',
    // El efecto se aplicará en la lógica de captura, no necesita un 'effect' aquí necesariamente
    // a menos que quieras un flag, ej: effect: { xpMultiplier: 2 }
  },

    // <-- AÑADIR POKE COIN -->
    'poke-coin': {
      id: 'poke-coin',
      name: 'Poké Coin',
      category: 'money', // O 'held' si hubiera mecánica de equipar
      sprite: require("../../assets/images/pokecoin.png"),
      findDifficulty: 0.82,
      description:
        'Una moneda de cambio que te permite comprar objetos.',
    },
};

// --- Lista de IDs de items que se pueden encontrar caminando ---
export const FINDABLE_ITEM_IDS: string[] = [
  'pokeball',
  'greatball',
  'masterball',
  'ultraball',
  'razz-berry',
  'shiny-charm',
  //'nanab-berry',
  'golden-razz-berry',
  // 'potion',
  //'revive',
  'lucky-egg', // <-- Añadido a la lista de encontrables
  'poke-coin',
];

// --- Función para calcular probabilidad de encontrar un item específico ---
// (Sin cambios)
export const calculateItemRarityChance = (
  difficulty: number | undefined
): number => {
  if (difficulty === undefined) return 0.1;
  return Math.max(0.01, 1 / (difficulty * 2));
};
