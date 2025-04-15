// src/types/Walk.ts (NUEVO ARCHIVO)
import { Coordinate } from './Location';
import { Encounter } from './Encounter';

// Define la estructura del resumen de una caminata
export interface WalkSummary {
  route: Coordinate[]; // La ruta recorrida (array de coordenadas)
  encounters: Encounter[]; // Array de encuentros (Pokémon o Items)
}
