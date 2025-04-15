// src/types/Player.ts (NUEVO ARCHIVO)

export interface PlayerStats {
  level: number;
  currentXP: number;
  xpToNextLevel: number;
  totalPokemonCaught: number;
  totalShinyCaught: number;
  totalDistanceWalked: number; // en metros
  profilePictureUri: string | null; // URI local de la imagen seleccionada
  playerName: string; // Nombre del jugador
  // Podrías añadir más stats aquí: huevos eclosionados, poképaradas visitadas (si existieran), etc.
}
