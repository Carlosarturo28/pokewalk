// src/hooks/usePokedexManagement.ts
import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
// Usar alias
import { PokedexEntry, PokedexStatus } from '@/src/types';
import {
  getNationalPokedexSpeciesList,
  getPokemonIdFromSpeciesUrl,
} from '@/src/services/pokeapi';
import {
  POKEDEX_STORAGE_KEY,
  NATIONAL_POKEDEX_COUNT,
} from '@/src/utils/constants';

export const usePokedexManagement = () => {
  const [pokedex, setPokedex] = useState<Map<number, PokedexEntry>>(new Map());
  const [isLoading, setIsLoading] = useState(true);

  // --- Inicializar (Asegurar que el campo nuevo exista) ---
  const initializePokedex = useCallback(async (setLoading = true) => {
    if (setLoading) setIsLoading(true);
    console.log('Initializing Pokedex...');
    try {
      const initialList = await getNationalPokedexSpeciesList();
      const initialPokedex = new Map<number, PokedexEntry>();
      initialList.forEach((species) => {
        const id = getPokemonIdFromSpeciesUrl(species.url);
        if (id !== null && id <= NATIONAL_POKEDEX_COUNT) {
          // Inicializa los nuevos campos a null/false
          initialPokedex.set(id, {
            pokemonId: id,
            name: species.name,
            status: PokedexStatus.Unknown,
            isCaughtShiny: false,
            caughtWithBallId: null,
          });
        }
      });
      setPokedex(initialPokedex);
      await AsyncStorage.setItem(
        POKEDEX_STORAGE_KEY,
        JSON.stringify(Array.from(initialPokedex.entries()))
      );
    } catch (error) {
      console.error('Failed init Pokedex:', error);
      setPokedex(new Map());
    } finally {
      if (setLoading) setIsLoading(false);
    }
  }, []);

  // --- Cargar (Asegurar que el campo nuevo exista) ---
  useEffect(() => {
    const loadPokedex = async () => {
      setIsLoading(true);
      let loaded = false;
      try {
        const storedData = await AsyncStorage.getItem(POKEDEX_STORAGE_KEY);
        console.log('=======================>', storedData);
        if (storedData) {
          const parsedData: [number, PokedexEntry][] = JSON.parse(storedData);
          if (Array.isArray(parsedData) && parsedData.length > 0) {
            // Asegura que los campos nuevos existan con valor por defecto si faltan
            const validatedMap = new Map(
              parsedData.map(([id, entry]) => [
                id,
                {
                  ...entry,
                  isCaughtShiny: entry.isCaughtShiny ?? false,
                  caughtWithBallId: entry.caughtWithBallId ?? null,
                },
              ])
            );
            setPokedex(validatedMap);
            loaded = true;
          } else {
            await AsyncStorage.removeItem(POKEDEX_STORAGE_KEY);
          }
        }
      } catch (error) {
        console.error('Failed load Pokedex:', error);
      }
      if (!loaded) {
        await initializePokedex(false);
      }
      setIsLoading(false);
    };
    loadPokedex();
  }, [initializePokedex]);

  // --- Guardar (sin cambios, ya guarda el objeto completo) ---
  useEffect(() => {
    /* ... (lógica de guardado) ... */
  }, [pokedex, isLoading]);

  // --- Actualizar Entrada (AHORA ACEPTA caughtWithBallId) ---
  const updatePokedexEntry = useCallback(
    (
      pokemonId: number,
      newStatus: PokedexStatus,
      spriteUrl?: string | null,
      isCaughtShiny: boolean = false,
      caughtWithBallId: string | null = null // <-- Nuevo parámetro
    ) => {
      setPokedex((prevPokedex) => {
        const currentEntry = prevPokedex.get(pokemonId);
        if (!currentEntry) return prevPokedex;

        const shouldUpdateStatus = newStatus > currentEntry.status;
        const shouldUpdateSprite =
          spriteUrl &&
          (!currentEntry.spriteUrl || newStatus === PokedexStatus.Caught);
        const shouldUpdateCaptureDetails = newStatus === PokedexStatus.Caught; // Actualizar shiny/ball solo al capturar

        if (
          shouldUpdateStatus ||
          shouldUpdateSprite ||
          shouldUpdateCaptureDetails
        ) {
          const newPokedex = new Map(prevPokedex);
          const updatedEntry: PokedexEntry = {
            ...currentEntry,
            status: shouldUpdateStatus ? newStatus : currentEntry.status,
            spriteUrl: shouldUpdateSprite ? spriteUrl : currentEntry.spriteUrl,
            // Actualiza shiny y ball SOLO si el nuevo estado es 'Caught'
            isCaughtShiny: shouldUpdateCaptureDetails
              ? isCaughtShiny
              : currentEntry.isCaughtShiny ?? false,
            caughtWithBallId: shouldUpdateCaptureDetails
              ? caughtWithBallId
              : currentEntry.caughtWithBallId ?? null,
          };
          newPokedex.set(pokemonId, updatedEntry);
          console.log(
            `Pokedex updated: ${pokemonId}, Status: ${
              PokedexStatus[updatedEntry.status]
            }, Shiny: ${updatedEntry.isCaughtShiny}, Ball: ${
              updatedEntry.caughtWithBallId
            }`
          );
          return newPokedex;
        }
        return prevPokedex;
      });
    },
    []
  );

  // --- Getters (sin cambios) ---
  const getPokemonStatus = useCallback(
    /* ... */ (id: number) => pokedex.get(id)?.status ?? PokedexStatus.Unknown,
    [pokedex]
  );
  const getPokedexEntry = useCallback(
    /* ... */ (id: number) => pokedex.get(id),
    [pokedex]
  );

  // --- Reset (Asegura que el campo nuevo se inicialice) ---
  const resetPokedexData = useCallback(async () => {
    console.log('Resetting Pokedex data...');
    setIsLoading(true);
    try {
      await AsyncStorage.removeItem(POKEDEX_STORAGE_KEY);
      await initializePokedex(false); // Re-inicializa
      console.log('Pokedex reset complete.');
    } catch (error) {
      console.error('Failed reset Pokedex:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [initializePokedex]);

  return {
    pokedex,
    isLoading,
    updatePokedexEntry,
    getPokemonStatus,
    getPokedexEntry,
    resetPokedexData,
  };
};
