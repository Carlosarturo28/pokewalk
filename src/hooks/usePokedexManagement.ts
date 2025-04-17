// src/hooks/usePokedexManagement.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
// Usar alias (asegúrate que estén configurados en tsconfig.json o babel.config.js)
import { PokedexEntry, PokedexStatus, PokemonTypeInfo } from '@/src/types';
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
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null); // Ref para el debounce

  // --- Inicializar (Asegurar que los campos nuevos existan) ---
  const initializePokedex = useCallback(async (setLoading = true) => {
    if (setLoading) setIsLoading(true);
    console.log('Initializing Pokedex...');
    try {
      const initialList = await getNationalPokedexSpeciesList();
      const initialPokedex = new Map<number, PokedexEntry>();
      initialList.forEach((species) => {
        const id = getPokemonIdFromSpeciesUrl(species.url);
        if (id !== null && id <= NATIONAL_POKEDEX_COUNT) {
          // Inicializa los nuevos campos a null/false/undefined
          initialPokedex.set(id, {
            pokemonId: id,
            name: species.name,
            status: PokedexStatus.Unknown,
            isCaughtShiny: false,
            caughtWithBallId: null,
            spriteUrl: undefined, // Asegurar que spriteUrl exista
          });
        }
      });
      setPokedex(initialPokedex);
      // Guardar inmediatamente después de inicializar
      await AsyncStorage.setItem(
        POKEDEX_STORAGE_KEY,
        JSON.stringify(Array.from(initialPokedex.entries()))
      );
      console.log('Initial Pokedex data saved after initialization.');
    } catch (error) {
      console.error('Failed init Pokedex:', error);
      setPokedex(new Map()); // Fallback a mapa vacío
    } finally {
      if (setLoading) setIsLoading(false);
    }
  }, []); // Sin dependencias, es una función autocontenida

  // --- Cargar (Asegurar que los campos nuevos existan) ---
  useEffect(() => {
    const loadPokedex = async () => {
      console.log('Attempting to load Pokedex...');
      setIsLoading(true);
      let loaded = false;
      try {
        const storedData = await AsyncStorage.getItem(POKEDEX_STORAGE_KEY);

        if (storedData) {
          const parsedData: [number, PokedexEntry][] = JSON.parse(storedData);
          if (Array.isArray(parsedData) && parsedData.length > 0) {
            // Asegura que los campos nuevos existan con valor por defecto si faltan
            const validatedMap = new Map(
              parsedData.map(([id, entry]) => [
                id,
                {
                  // Asegura valores por defecto para todos los campos
                  pokemonId: entry.pokemonId ?? id,
                  name: entry.name ?? 'Unknown',
                  status: entry.status ?? PokedexStatus.Unknown,
                  spriteUrl: entry.spriteUrl ?? undefined,
                  isCaughtShiny: entry.isCaughtShiny ?? false,
                  caughtWithBallId: entry.caughtWithBallId ?? null,
                },
              ])
            );
            setPokedex(validatedMap);
            loaded = true;
            console.log(
              `Pokedex loaded from storage (${validatedMap.size} entries).`
            );
          } else {
            console.warn('Stored Pokedex data is invalid or empty. Clearing.');
            await AsyncStorage.removeItem(POKEDEX_STORAGE_KEY); // Limpiar datos inválidos
          }
        } else {
          console.log('No stored Pokedex data found.');
        }
      } catch (error) {
        console.error(
          'Failed load/parse Pokedex from storage, will re-initialize:',
          error
        );
        // Intenta limpiar datos corruptos si falla el parseo
        try {
          await AsyncStorage.removeItem(POKEDEX_STORAGE_KEY);
        } catch (removeError) {
          console.error(
            'Failed to remove corrupted Pokedex data:',
            removeError
          );
        }
      }

      // Si no se cargó desde el storage, inicializar
      if (!loaded) {
        await initializePokedex(false); // Llama a la inicialización SIN cambiar isLoading aquí
      }
      setIsLoading(false); // Marca como terminado de cargar/inicializar al final
    };

    loadPokedex();
    // La dependencia initializePokedex es correcta aquí porque loadPokedex la usa como fallback.
  }, [initializePokedex]);

  // --- Guardar Pokedex en AsyncStorage (con Debounce) ---
  useEffect(() => {
    // Limpia el timeout anterior si existe (debouncing)
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // No guardar mientras carga o si el mapa está vacío (podría ser un estado intermedio o de error)
    if (isLoading || pokedex.size === 0) {
      // console.log('Save skipped: isLoading or pokedex empty.');
      return;
    }

    // Programa el guardado después de un breve retraso
    saveTimeoutRef.current = setTimeout(async () => {
      console.log('Debounced save triggered. Saving Pokedex...');
      try {
        // Asegúrate que el mapa que guardas tenga los campos por defecto definidos si es necesario
        // Aunque la lógica de carga/inicialización ya debería encargarse de esto.
        const dataToStore = JSON.stringify(Array.from(pokedex.entries()));
        await AsyncStorage.setItem(POKEDEX_STORAGE_KEY, dataToStore);
        console.log('Pokedex saved successfully.');
      } catch (error) {
        console.error('Failed to save Pokedex data to storage:', error);
      }
    }, 1000); // Espera 1 segundo después de la última modificación para guardar

    // Función de limpieza para cancelar el timeout si el componente se desmonta
    // o si el efecto se ejecuta de nuevo antes de que el timeout termine.
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
    // Dependencias: Se ejecuta cada vez que 'pokedex' cambia o 'isLoading' cambia
  }, [pokedex, isLoading]);

  // --- Actualizar Entrada (AHORA ACEPTA caughtWithBallId) ---
  const updatePokedexEntry = useCallback((
    pokemonId: number,
    newStatus: PokedexStatus,
    spriteUrl?: string | null,
    isCaughtShiny: boolean = false, // Mantenemos nombre original
    caughtWithBallId: string | null = null, // Mantenemos nombre original
    pokemonTypes?: PokemonTypeInfo[] // <-- NUEVO PARÁMETRO OPCIONAL
) => {
    setPokedex(prevPokedex => {
        const currentEntry = prevPokedex.get(pokemonId);
        if (!currentEntry) {
            console.warn(`Attempted update non-existent Pokedex entry: ID ${pokemonId}`);
            return prevPokedex;
        }

        // Determinar qué necesita actualizarse
        const shouldUpdateStatus = newStatus > currentEntry.status;
        // Actualizar sprite si es nuevo Y (no teníamos O se capturó)
        const shouldUpdateSprite = spriteUrl && (!currentEntry.spriteUrl || newStatus === PokedexStatus.Caught);
        // Actualizar detalles de captura SOLO si el estado es 'Caught' y los detalles cambian
        const shouldUpdateCaptureDetails = newStatus === PokedexStatus.Caught &&
                                           (currentEntry.isCaughtShiny !== isCaughtShiny || currentEntry.caughtWithBallId !== caughtWithBallId);
        // Actualizar tipos SOLO si se proporcionan y no los teníamos ya
        const shouldUpdateTypes = pokemonTypes && !currentEntry.types;

        // Si nada cambió, retornar el mapa anterior
        if (!shouldUpdateStatus && !shouldUpdateSprite && !shouldUpdateCaptureDetails && !shouldUpdateTypes) {
            return prevPokedex;
        }

        // Crear entrada actualizada
        const updatedEntry: PokedexEntry = {
             ...currentEntry,
             status: shouldUpdateStatus ? newStatus : currentEntry.status,
             spriteUrl: shouldUpdateSprite ? spriteUrl : currentEntry.spriteUrl,
             // Si se capturó, actualiza detalles de captura, si no, mantiene los anteriores
             isCaughtShiny: newStatus === PokedexStatus.Caught ? isCaughtShiny : currentEntry.isCaughtShiny,
             caughtWithBallId: newStatus === PokedexStatus.Caught ? caughtWithBallId : currentEntry.caughtWithBallId,
             // Guarda los tipos si se proporcionaron y no existían
             types: shouldUpdateTypes ? pokemonTypes : currentEntry.types,
         };

        // Si se está marcando como capturado y se provee un sprite, usar ese sprite
         if (newStatus === PokedexStatus.Caught && spriteUrl) {
            updatedEntry.spriteUrl = spriteUrl;
        }

        // Crear nueva copia del mapa y actualizar la entrada
        const newPokedex = new Map(prevPokedex);
        newPokedex.set(pokemonId, updatedEntry);
        // console.log(`Pokedex entry updated: ID ${pokemonId}, Status: ${PokedexStatus[updatedEntry.status]}, Types: ${updatedEntry.types ? 'Yes' : 'No'}`);
        return newPokedex;
    });
}, []); // Sin dependencias externas

  // --- Getters (sin cambios en su lógica interna, solo asegurando que estén aquí) ---
  const getPokemonStatus = useCallback(
    (id: number): PokedexStatus =>
      pokedex.get(id)?.status ?? PokedexStatus.Unknown,
    [pokedex]
  );

  const getPokedexEntry = useCallback(
    (id: number): PokedexEntry | undefined => pokedex.get(id),
    [pokedex]
  );

  // --- Reset (Asegura que el campo nuevo se inicialice) ---
  const resetPokedexData = useCallback(async () => {
    console.log('Resetting Pokedex data...');
    setIsLoading(true); // Poner en estado de carga mientras se resetea
    // Cancelar cualquier guardado pendiente para evitar conflictos
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null; // Limpiar la referencia
    }
    try {
      await AsyncStorage.removeItem(POKEDEX_STORAGE_KEY);
      // Llama a initializePokedex directamente para reconstruir el estado y guardarlo
      // false para que no setee isLoading de nuevo dentro de initialize, lo hacemos en el finally
      await initializePokedex(false);
      console.log('Pokedex reset complete.');
    } catch (error) {
      console.error('Failed reset Pokedex:', error);
      // Podrías intentar establecer un estado de error aquí si es necesario
      setPokedex(new Map()); // Asegurar que quede vacío en caso de error de reset
    } finally {
      setIsLoading(false); // Quitar estado de carga al final del proceso
    }
  }, [initializePokedex]); // Depende de initializePokedex

  // --- Exportar todo ---
  return {
    pokedex,
    isLoading,
    updatePokedexEntry,
    getPokemonStatus,
    getPokedexEntry,
    resetPokedexData,
  };
};
