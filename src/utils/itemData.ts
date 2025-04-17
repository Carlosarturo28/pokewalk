// src/utils/itemData.ts
import { Item, ItemId } from '@/src/types/Item'; // Ajusta ruta

const ITEM_SPRITE_URL_BASE =
  'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/';


export const ITEMS_DB: { [key: string]: Item } = {
  // === Poké Balls ===
  pokeball: {
    id: 'pokeball', name: 'Poké Ball', category: 'pokeball',
    sprite: {uri: `${ITEM_SPRITE_URL_BASE}poke-ball.png`},
    findDifficulty: 0.9, price: 5, // <-- PRECIO AÑADIDO
    description: 'Un dispositivo para capturar Pokémon salvajes.',
  },
  greatball: {
    id: 'greatball', name: 'Great Ball', category: 'pokeball',
    sprite: {uri: `${ITEM_SPRITE_URL_BASE}great-ball.png`},
    findDifficulty: 0.7, price: 7, // <-- PRECIO AÑADIDO
    description: 'Una Poké Ball con mayor tasa de éxito que la estándar.',
  },
  ultraball: {
    id: 'ultraball', name: 'Ultra Ball', category: 'pokeball',
    sprite: {uri: `${ITEM_SPRITE_URL_BASE}ultra-ball.png`},
    findDifficulty: 0.65, price: 10, // <-- PRECIO AÑADIDO
    description: 'Una Poké Ball con una tasa de éxito superior.',
  },
  masterball: { // Quizás no vendible? O muy cara?
    id: 'masterball', name: 'Master Ball', category: 'pokeball',
    sprite: {uri: `${ITEM_SPRITE_URL_BASE}master-ball.png`},
    findDifficulty: 0.01, price: 400, // <-- PRECIO EJEMPLO (MUY ALTO)
    description: 'La mejor Poké Ball. Captura cualquier Pokémon sin fallar.',
  },

  // === Bayas ===
  'razz-berry': {
    id: 'razz-berry', name: 'Razz Berry', category: 'berry',
    sprite: {uri: `${ITEM_SPRITE_URL_BASE}razz-berry.png`},
    findDifficulty: 0.75, price: 2, // <-- PRECIO AÑADIDO
    description: 'Alimenta a un Pokémon para que sea más fácil de atrapar.',
    effect: { catchRateModifier: 1.5 },
  },
  'nanab-berry': {
    id: 'nanab-berry', name: 'Nanab Berry', category: 'berry',
    sprite: {uri: `${ITEM_SPRITE_URL_BASE}nanab-berry.png`},
    findDifficulty: 0.75, price: 2, // <-- PRECIO AÑADIDO
    description: 'Calma a un Pokémon, haciendo que deje de moverse.',
  },
    'pinap-berry': { // Ejemplo añadido
    id: 'pinap-berry', name: 'Pinap Berry', category: 'berry',
    sprite: {uri: `${ITEM_SPRITE_URL_BASE}pinap-berry.png`},
    findDifficulty: 0.75, price: 2, // <-- PRECIO AÑADIDO
    description: 'Duplica los caramelos obtenidos al capturar.',
  },
  'golden-razz-berry': {
    id: 'golden-razz-berry', name: 'Golden Razz Berry', category: 'berry',
    sprite: {uri: `https://archives.bulbagarden.net/media/upload/7/7e/Bag_Golden_Razz_Berry_Sprite.png`},
    findDifficulty: 0.55, price: 3, // <-- PRECIO AÑADIDO
    description: 'Aumenta drásticamente la facilidad de captura.',
    effect: { catchRateModifier: 2.5 },
  },

  // === Key Items (Normalmente no se venden) ===
  'shiny-charm': {
    id: 'shiny-charm', name: 'Shiny Charm', category: 'key',
    sprite: {uri: `${ITEM_SPRITE_URL_BASE}shiny-charm.png`},
    findDifficulty: 0.04, // No tiene precio
    description: 'Aumenta la probabilidad de encontrar Pokémon Shiny.',
    effect: { shinyRateMultiplier: 3 },
  },

  // === Otros Items ===
  potion: {
    id: 'potion', name: 'Potion', category: 'medicine',
    sprite: {uri:`${ITEM_SPRITE_URL_BASE}potion.png`},
    findDifficulty: 0.7, price: 5, // <-- PRECIO AÑADIDO
    description: 'Restaura 20 PS de un Pokémon.',
  },
  revive: {
    id: 'revive', name: 'Revive', category: 'medicine',
    sprite: {uri: `${ITEM_SPRITE_URL_BASE}revive.png`},
    findDifficulty: 0.5, price: 5, // <-- PRECIO AÑADIDO
    description: 'Revive a un Pokémon debilitado.',
  },
  'lucky-egg': {
    id: 'lucky-egg', name: 'Lucky Egg', category: 'other',
    sprite: {uri: `${ITEM_SPRITE_URL_BASE}lucky-egg.png`},
    findDifficulty: 0.2, price: 50, // <-- PRECIO AÑADIDO
    description: 'Duplica la XP ganada al capturar Pokémon.',
  },

  // === Moneda (No se vende a sí misma, no necesita precio) ===
  'poke-coin': {
      id: 'poke-coin',
      name: 'Poké Coin',
      category: 'money',
      sprite: require("../../assets/images/pokecoin.png"), // Ajusta ruta
      findDifficulty: 0.82, // Se puede encontrar caminando
      description: 'Moneda utilizada para comprar objetos en la tienda.',
    },
};

// --- Lista de IDs de items que se pueden ENCONTRAR caminando ---
export const FINDABLE_ITEM_IDS: ItemId[] = [ // Usa ItemId si lo tienes
  'pokeball', 'greatball', 'masterball', 'ultraball',
  'razz-berry', 'golden-razz-berry',
  'shiny-charm', 'lucky-egg',
  'poke-coin',
];

// --- *** NUEVA LISTA: IDs de items que se pueden COMPRAR en la tienda *** ---
export const SHOP_LISTING_IDS: ItemId[] = [
    'pokeball',
    'greatball',
    'ultraball',
    'masterball',
    'razz-berry',
    'golden-razz-berry',
    'lucky-egg',
];