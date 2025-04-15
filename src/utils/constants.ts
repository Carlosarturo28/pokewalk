// src/utils/constants.ts
import { Item } from '@/src/types'; // Alias
import { ITEMS_DB } from './itemData'; // Alias

// --- Gameplay Constants ---
export const LOCATION_UPDATE_INTERVAL_MS = 5000;
export const LOCATION_UPDATE_DISTANCE_METERS = 10;
export const ENCOUNTER_CHECK_DISTANCE_METERS = 50;
export const ENCOUNTER_PROBABILITY = 0.3;
export const SHINY_PROBABILITY = 1 / 4096;

// --- Items ---
export const ITEM_FIND_PROBABILITY_BASE = 0.15;
export const SHINY_CHARM_MULTIPLIER = 3;
export const LUCKY_EGG_XP_MULTIPLIER = 2;

// --- XP y Niveles ---
export const XP_PER_CATCH_BASE = 100;
export const XP_PER_CATCH_SHINY_BONUS = 500;
export const XP_PER_CATCH_NEW_POKEMON_BONUS = 300;
export const XP_PER_KM_WALKED = 50;
export const calculateXPForLevel = (level: number): number => {
  return Math.floor(100 * Math.pow(level, 2.5));
};
export const MAX_PLAYER_LEVEL = 50;

// --- Pokeballs ---
export const POKEBALLS: { [key: string]: { name: string; modifier: number } } =
  {
    pokeball: { name: 'Poké Ball', modifier: 1.0 },
    greatball: { name: 'Great Ball', modifier: 1.5 },
    ultraball: { name: 'Ultra Ball', modifier: 2.0 },
    masterball: { name: 'Master Ball', modifier: 255.0 },
  };

// --- Berries (Datos específicos para el modal de captura) ---
export const BERRY_DATA: { [key: string]: Item } = Object.keys(ITEMS_DB)
  .filter(
    (key) =>
      ITEMS_DB[key].category === 'berry' &&
      ITEMS_DB[key].effect?.catchRateModifier
  )
  .reduce((acc, key) => {
    acc[key] = ITEMS_DB[key];
    return acc;
  }, {} as { [key: string]: Item });

// --- Pokedex ---
export const POKEDEX_STORAGE_KEY = '@PokemonWalkApp:pokedexData_v1';
export const NATIONAL_POKEDEX_COUNT = 251;

// --- Capture Formula Constants ---
export const MAX_CATCH_RATE_VALUE = 255;

// --- Player Profile ---
export const PLAYER_STATS_STORAGE_KEY = '@PokemonWalkApp:playerStats_v1';

// --- Backpack ---
export const BACKPACK_STORAGE_KEY = '@PokemonWalkApp:backpackData_v1'; // <-- **AÑADIDA ESTA EXPORTACIÓN**
