// src/types/Pokemon.ts

export interface PokemonSpeciesInfo {
  name: string;
  url: string;
}

export interface PokemonSpecies {
  id: number;
  name: string;
  capture_rate: number;
  flavor_text_entries?: {
    flavor_text: string;
    language: { name: string; url: string };
    version: { name: string; url: string };
  }[];
}

export interface PokemonDetails {
  id: number;
  name: string;
  sprites: {
    front_default: string | null;
    front_shiny: string | null;
  };
  types: { slot: number; type: { name: string; url: string } }[];
  stats?: {
    // <-- HECHO OPCIONAL
    base_stat: number;
    effort: number;
    stat: { name: string; url: string };
  }[];
  // Otros campos opcionales si no se usan siempre: height?, weight?, abilities?
}

// Interfaz combinada (sin cambios necesarios aquí)
export interface Pokemon extends PokemonDetails {
  capture_rate: number;
}

// Tipos de relación (ya no se usan en detalle, pero los dejamos por si acaso)
export interface TypeRelations {
  double_damage_from: { name: string; url: string }[];
  double_damage_to: { name: string; url: string }[];
  half_damage_from: { name: string; url: string }[];
  half_damage_to: { name: string; url: string }[];
  no_damage_from: { name: string; url: string }[];
  no_damage_to: { name: string; url: string }[];
}
export interface TypeDetails {
  id: number;
  name: string;
  damage_relations: TypeRelations;
  pokemon: { pokemon: { name: string; url: string }; slot: number }[];
}
