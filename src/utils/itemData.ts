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
    sprite: `${ITEM_SPRITE_URL_BASE}poke-ball.png`,
    findDifficulty: 1,
    description: 'Un dispositivo para capturar Pokémon salvajes.',
  },
  greatball: {
    /* ... */ id: 'greatball',
    name: 'Great Ball',
    category: 'pokeball',
    sprite: `${ITEM_SPRITE_URL_BASE}great-ball.png`,
    findDifficulty: 4,
    description: 'Una Poké Ball con mayor tasa de éxito que la estándar.',
  },
  ultraball: {
    /* ... */ id: 'ultraball',
    name: 'Ultra Ball',
    category: 'pokeball',
    sprite: `${ITEM_SPRITE_URL_BASE}ultra-ball.png`,
    findDifficulty: 8,
    description: 'Una Poké Ball con una tasa de éxito superior.',
  },
  masterball: {
    /* ... */ id: 'masterball',
    name: 'Master Ball',
    category: 'pokeball',
    sprite: `${ITEM_SPRITE_URL_BASE}master-ball.png`,
    findDifficulty: 1000,
    description: 'La mejor Poké Ball. Captura cualquier Pokémon sin fallar.',
  },

  // === Bayas ===
  'razz-berry': {
    /* ... */ id: 'razz-berry',
    name: 'Razz Berry',
    category: 'berry',
    sprite: `${ITEM_SPRITE_URL_BASE}razz-berry.png`,
    findDifficulty: 3,
    description: 'Alimenta a un Pokémon para que sea más fácil de atrapar.',
    effect: { catchRateModifier: 1.5 },
  },
  'nanab-berry': {
    /* ... */ id: 'nanab-berry',
    name: 'Nanab Berry',
    category: 'berry',
    sprite: `${ITEM_SPRITE_URL_BASE}nanab-berry.png`,
    findDifficulty: 3,
    description: 'Calma a un Pokémon, haciendo que deje de moverse.',
  },
  'golden-razz-berry': {
    /* ... */ id: 'golden-razz-berry',
    name: 'Golden Razz Berry',
    category: 'berry',
    sprite: `${ITEM_SPRITE_URL_BASE}golden-razz-berry.png`,
    findDifficulty: 15,
    description: 'Aumenta drásticamente la facilidad de captura.',
    effect: { catchRateModifier: 2.5 },
  },

  // === Key Items ===
  'shiny-charm': {
    /* ... */ id: 'shiny-charm',
    name: 'Shiny Charm',
    category: 'key',
    sprite: `${ITEM_SPRITE_URL_BASE}shiny-charm.png`,
    findDifficulty: 500,
    description: 'Aumenta la probabilidad de encontrar Pokémon Shiny.',
    effect: { shinyRateMultiplier: 3 },
  },

  // === Otros Items ===
  potion: {
    /* ... */ id: 'potion',
    name: 'Potion',
    category: 'medicine',
    sprite: `${ITEM_SPRITE_URL_BASE}potion.png`,
    findDifficulty: 2,
    description: 'Restaura 20 PS de un Pokémon.',
  },
  revive: {
    /* ... */ id: 'revive',
    name: 'Revive',
    category: 'medicine',
    sprite: `${ITEM_SPRITE_URL_BASE}revive.png`,
    findDifficulty: 6,
    description: 'Revive a un Pokémon debilitado.',
  },

  // <-- AÑADIR LUCKY EGG -->
  'lucky-egg': {
    id: 'lucky-egg',
    name: 'Lucky Egg',
    category: 'other', // O 'held' si hubiera mecánica de equipar
    sprite: `${ITEM_SPRITE_URL_BASE}lucky-egg.png`,
    findDifficulty: 30, // Bastante raro
    description:
      'Un huevo que otorga felicidad y duplica la XP ganada al capturar Pokémon.',
    // El efecto se aplicará en la lógica de captura, no necesita un 'effect' aquí necesariamente
    // a menos que quieras un flag, ej: effect: { xpMultiplier: 2 }
  },
};

// --- Lista de IDs de items que se pueden encontrar caminando ---
export const FINDABLE_ITEM_IDS: string[] = [
  'pokeball',
  'greatball',
  'ultraball',
  'razz-berry',
  'nanab-berry',
  'golden-razz-berry',
  'potion',
  'revive',
  'lucky-egg', // <-- Añadido a la lista de encontrables
];

// --- Función para calcular probabilidad de encontrar un item específico ---
// (Sin cambios)
export const calculateItemRarityChance = (
  difficulty: number | undefined
): number => {
  if (difficulty === undefined) return 0.1;
  return Math.max(0.01, 1 / (difficulty * 2));
};
