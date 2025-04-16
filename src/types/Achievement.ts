import { ImageSourcePropType } from 'react-native';
import { ItemId } from './Item'; // Asume que tienes un tipo ItemId

// Tipo para definir cómo se calcula el progreso de un logro
export type AchievementCalculationType =
  | 'TOTAL_CAPTURED' // Progreso basado en playerStats.totalPokemonCaught
  | 'POKEDEX_CAUGHT_COUNT' // Progreso basado en número de entradas 'Caught' en Pokedex
  | 'POKEDEX_TYPE_CAUGHT_COUNT'; // Progreso basado en número de entradas 'Caught' de un tipo específico

// Define la estructura de una recompensa
export interface AchievementReward {
  itemId: ItemId; // ID del item (ej. 'pokeball', 'razz-berry', 'lucky-egg')
  quantity: number;
}

// Define la estructura de un logro en la configuración
export interface AchievementDefinition {
  id: string; // Identificador único (ej. 'catch_10', 'pokedex_complete', 'type_fire_20')
  title: string; // Nombre visible del logro
  description: string; // Descripción de lo que hay que hacer
  medalImage: ImageSourcePropType; // La imagen de la medalla (requiere())
  goal: number; // El número a alcanzar para completar el logro
  calculationType: AchievementCalculationType;
  calculationTarget?: string; // Para tipos específicos (ej. 'fire', 'water')
  rewards: AchievementReward[]; // Array de recompensas
}

// Define cómo se almacena el progreso de un jugador para un logro
export interface AchievementProgressData {
  currentValue: number; // El progreso actual del jugador hacia el 'goal'
  achieved: boolean; // Si el logro ya ha sido completado y recompensado
}