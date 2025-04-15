// src/types/Encounter.ts
import { Coordinate } from './Location';
import { Pokemon } from './Pokemon';
import { Item } from './Item'; // <-- Necesitamos importar el tipo Item

// Tipos posibles de encuentros (expandible)
export type EncounterType = 'pokemon' | 'item';

// Interfaz base común a todos los encuentros
export interface BaseEncounter {
  id: string; // ID único para key en listas y manejo de estado
  type: EncounterType;
  location: Coordinate; // Dónde ocurrió el encuentro
}

// Interfaz específica para encuentros Pokémon
export interface PokemonEncounter extends BaseEncounter {
  type: 'pokemon';
  pokemonDetails: Pokemon; // Datos completos del Pokémon desde la API
  isShiny: boolean;
  caught: boolean; // Estado de captura para este encuentro específico
}

// Interfaz específica para encuentros de Items
export interface ItemEncounter extends BaseEncounter {
  type: 'item';
  itemDetails: Item; // Los detalles del item encontrado
  quantity: number; // Cantidad encontrada (normalmente 1)
  // 'collected' no es necesario si se añade directamente a la mochila,
  // pero lo guardamos en el resumen para mostrarlo.
}

// Tipo unión para representar cualquier tipo de encuentro posible en el resumen
export type Encounter = PokemonEncounter | ItemEncounter; // <-- Actualizado
