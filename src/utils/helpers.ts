// src/utils/helpers.ts
import { Coordinate } from '@/src/types'; // Alias
import { MAX_CATCH_RATE_VALUE, POKEBALLS } from './constants';

// --- calculateDistance (Función Haversine) ---
export function calculateDistance(
  coord1: Coordinate,
  coord2: Coordinate
): number {
  const R = 6371e3; // Radio Tierra en metros
  const φ1 = (coord1.latitude * Math.PI) / 180;
  const φ2 = (coord2.latitude * Math.PI) / 180;
  const Δφ = ((coord2.latitude - coord1.latitude) * Math.PI) / 180;
  const Δλ = ((coord2.longitude - coord1.longitude) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const distance = R * c;
  return distance;
}

// --- calculateCatchChance (Probabilidad de captura simplificada) ---
export function calculateCatchChance(
  captureRate: number | undefined,
  pokeballType: keyof typeof POKEBALLS = 'pokeball',
  berryModifier: number = 1.0
): number {
  if (captureRate === undefined || captureRate === null) return 0.05; // Chance baja si no hay datos

  const ball = POKEBALLS[pokeballType];
  const ballModifier = ball ? ball.modifier : 1.0;
  const rate = Math.max(1, captureRate); // Asegura mínimo 1

  let chance = (rate / MAX_CATCH_RATE_VALUE) * ballModifier * berryModifier;

  // Asegura que la chance esté entre 0 y 1
  return Math.min(1.0, Math.max(0, chance));
}

// --- *** NUEVO: Obtener Dificultad de Captura (Categoría Textual) *** ---
export type CaptureDifficulty =
  | 'Muy Fácil'
  | 'Fácil'
  | 'Normal'
  | 'Difícil'
  | 'Muy Difícil'
  | 'Legendario'
  | 'Imposible';

export function getCaptureDifficulty(
  captureRate: number | undefined | null
): CaptureDifficulty {
  if (captureRate === undefined || captureRate === null) return 'Normal'; // Default

  // Define los umbrales para cada categoría
  if (captureRate >= 200) return 'Muy Fácil'; // Ej: Caterpie, Pidgey (255)
  if (captureRate >= 120) return 'Fácil'; // Ej: Pikachu (190), Growlithe (190)
  if (captureRate >= 60) return 'Normal'; // Ej: Machop(180), Abra(200) -> Ajustar rangos si es necesario
  if (captureRate >= 30) return 'Difícil'; // Ej: Starters (45), Eevee (45), Snorlax (25)
  if (captureRate > 3) return 'Muy Difícil'; // Ej: Beldum (3), Skarmory (25), Lapras (45)
  if (captureRate === 3) return 'Legendario'; // La mayoría de legendarios (3)
  // Cualquier valor menor o igual a 0 (no debería pasar)
  return 'Imposible';
}

// --- *** NUEVO: Helper para obtener color según dificultad *** ---
export const getDifficultyColor = (difficulty: CaptureDifficulty): string => {
  switch (difficulty) {
    case 'Muy Fácil':
      return '#4caf50'; // Verde
    case 'Fácil':
      return '#aed581'; // Verde claro lima
    case 'Normal':
      return '#ffb300'; // Naranja ambar
    case 'Difícil':
      return '#fb8c00'; // Naranja oscuro
    case 'Muy Difícil':
      return '#e53935'; // Rojo
    case 'Legendario':
      return '#8e24aa'; // Púrpura
    case 'Imposible':
      return '#424242'; // Gris oscuro
    default:
      return '#9e9e9e'; // Gris por defecto
  }
};
