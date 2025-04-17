// src/types/Pokedex.ts

export interface PokemonTypeInfo {
  slot: number;
  type: { name: string; url: string };
}

export enum PokedexStatus {
  Unknown = 0,
  Seen = 1,
  Caught = 2,
}

export interface PokedexEntry {
  pokemonId: number;
  name: string;
  status: PokedexStatus;
  spriteUrl?: string | null;
  isCaughtShiny?: boolean;
  caughtWithBallId?: string | null; // <-- NUEVO: ID de la Poké Ball usada (ej. 'pokeball', 'greatball')
  types?: PokemonTypeInfo[];
}
