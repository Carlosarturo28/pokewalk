// src/services/pokeapi.ts
import {
  Pokemon,
  PokemonDetails,
  PokemonSpecies,
  PokemonSpeciesInfo,
  TypeDetails,
} from '@/src/types';

const BASE_URL = 'https://pokeapi.co/api/v2';

// Cachés
const pokemonCache = new Map<number, Pokemon>();
const speciesCache = new Map<number, PokemonSpecies>();
const typeCache = new Map<string, TypeDetails>();

// --- Obtener Detalles de la ESPECIE ---
export const getPokemonSpeciesDetails = async (
  id: number
): Promise<PokemonSpecies | null> => {
  if (speciesCache.has(id)) {
    /* console.log(`[Cache Hit - Species] ${id}`); */ return (
      speciesCache.get(id) ?? null
    );
  }
  console.log(`[API Fetch - Species] Species ID: ${id}`);
  try {
    const response = await fetch(`${BASE_URL}/pokemon-species/${id}`);
    // --- Comprobación de Respuesta OK ---
    if (!response.ok) {
      console.error(
        `Error fetching Species ${id}: Status ${response.status} ${response.statusText}`
      );
      console.error(`URL: ${response.url}`);
      // Podrías intentar leer el cuerpo del error si existe
      // const errorBody = await response.text(); console.error("Error body:", errorBody);
      return null; // Retorna null si la respuesta no fue exitosa
    }
    const data: PokemonSpecies = await response.json();
    speciesCache.set(id, data);
    return data;
  } catch (error) {
    // Captura errores de red (fetch falló, sin conexión, etc.)
    console.error(`Network error fetching Species ${id}:`, error);
    return null;
  }
};

// --- Obtener Detalles del POKEMON (forma y stats) ---
// (Esta función ahora NO se usa directamente en el detalle, pero sí en getPokemonDetails combinado)
const getPokemonFormData = async (
  id: number
): Promise<PokemonDetails | null> => {
  console.log(`[API Fetch - Pokemon Form] ID: ${id}`);
  try {
    const response = await fetch(`${BASE_URL}/pokemon/${id}`);
    if (!response.ok) {
      console.error(
        `Error fetching Pokemon Form ${id}: Status ${response.status} ${response.statusText}`
      );
      console.error(`URL: ${response.url}`);
      return null;
    }
    const data: PokemonDetails = await response.json();
    return data;
  } catch (error) {
    console.error(`Network error fetching Pokemon Form ${id}:`, error);
    return null;
  }
};

// --- Función COMBINADA para obtener Pokémon + Species ---
// (Esta es la que usa el hook useWalkManagement)
export const getPokemonDetails = async (
  id: number
): Promise<Pokemon | null> => {
  if (pokemonCache.has(id)) {
    /* console.log(`[Cache Hit - Combined] ${id}`); */ return (
      pokemonCache.get(id) ?? null
    );
  }
  console.log(`[API Fetch - Combined] Pokemon ID: ${id}`);
  try {
    // Llama a las funciones separadas que ya tienen manejo de errores
    const [detailsData, speciesData] = await Promise.all([
      getPokemonFormData(id), // Obtiene forma/stats
      getPokemonSpeciesDetails(id), // Obtiene especie/capture_rate/desc
    ]);

    // Si ALGUNA de las llamadas falló, retorna null
    if (!detailsData || !speciesData) {
      console.error(
        `Failed to get complete combined data for Pokemon ${id}. Details: ${!!detailsData}, Species: ${!!speciesData}`
      );
      return null;
    }

    // Combina los datos si ambas llamadas fueron exitosas
    const combinedData: Pokemon = {
      ...detailsData,
      capture_rate: speciesData.capture_rate,
      // Hereda flavor_text si existe en speciesData, útil si se accede desde aquí
      // flavor_text_entries: speciesData.flavor_text_entries,
    };
    pokemonCache.set(id, combinedData);
    return combinedData;
  } catch (error) {
    // Este catch es por si Promise.all falla (raro si las funciones internas ya tienen catch)
    console.error(
      `Unexpected error in getPokemonDetails Promise.all for ${id}:`,
      error
    );
    return null;
  }
};

// --- Obtener Detalles de un Tipo ---
export const getTypeDetails = async (
  typeIdentifier: string | number
): Promise<TypeDetails | null> => {
  const typeName = typeIdentifier.toString().toLowerCase();
  if (typeCache.has(typeName)) {
    /* console.log(`[Cache Hit - Type] ${typeName}`); */ return (
      typeCache.get(typeName) ?? null
    );
  }
  console.log(`[API Fetch - Type] Type: ${typeName}`);
  try {
    const response = await fetch(`${BASE_URL}/type/${typeName}`);
    if (!response.ok) {
      console.error(
        `Error fetching Type ${typeName}: Status ${response.status} ${response.statusText}`
      );
      console.error(`URL: ${response.url}`);
      return null;
    }
    const data: TypeDetails = await response.json();
    typeCache.set(typeName, data);
    return data;
  } catch (error) {
    console.error(`Network error fetching Type ${typeName}:`, error);
    return null;
  }
};

// --- Funciones de Lista y Helper ID (sin cambios) ---
export const getNationalPokedexSpeciesList = async (): Promise<
  PokemonSpeciesInfo[]
> => {
  /* ... */ try {
    const r = await fetch(
      `${BASE_URL}/pokemon-species?limit=${NATIONAL_POKEDEX_COUNT}&offset=0`
    );
    if (!r.ok) return [];
    const d = await r.json();
    return (d.results as PokemonSpeciesInfo[]).filter((s) => s && s.url);
  } catch (e) {
    console.error('Net err list:', e);
    return [];
  }
};
export const getPokemonIdFromSpeciesUrl = (url: string): number | null => {
  /* ... */ const m = url.match(/\/(\d+)\/?$/);
  return m ? parseInt(m[1], 10) : null;
};

// --- Constante del límite (repetida aquí por claridad, asegúrate que coincida con constants.ts) ---
const NATIONAL_POKEDEX_COUNT = 251;
