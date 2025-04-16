// src/hooks/useWalkManagement.ts
import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
// Usar alias e importar WalkSummary desde types
import {
  Coordinate,
  Encounter,
  PokemonEncounter,
  PokedexStatus,
  ItemEncounter,
  Item,
  WalkSummary,
} from '@/src/types';
import { useLocationTracking } from '@/src/hooks/useLocationTracking';
import { usePokedex } from '@/src/contexts/PokedexContext';
import { useBackpack } from '@/src/contexts/BackpackContext';
import { usePlayer } from '@/src/contexts/PlayerContext';
import { getPokemonDetails } from '@/src/services/pokeapi';
import { calculateDistance } from '@/src/utils/helpers';
import { ITEMS_DB, FINDABLE_ITEM_IDS } from '@/src/utils/itemData';
import {
  ENCOUNTER_CHECK_DISTANCE_METERS,
  ENCOUNTER_PROBABILITY,
  SHINY_PROBABILITY,
  NATIONAL_POKEDEX_COUNT,
  ITEM_FIND_PROBABILITY_BASE,
  SHINY_CHARM_MULTIPLIER,
} from '@/src/utils/constants';

export const useWalkManagement = () => {
  const {
    isTracking: isLocationTracking,
    currentLocation,
    routeCoordinates,
    startTracking: startLocationTracking,
    stopTracking: stopLocationTracking,
  } = useLocationTracking();

  const { updatePokedexEntry } = usePokedex();
  const { addItem, hasItem } = useBackpack();
  const { addDistanceWalked } = usePlayer();

  const [isProcessingWalk, setIsProcessingWalk] = useState(false);
  // Ahora usa el tipo WalkSummary importado
  const [currentWalkSummary, setCurrentWalkSummary] =
    useState<WalkSummary | null>(null);
  // Señal numérica para indicar que el resumen está listo
  const [showSummaryModalSignal, setShowSummaryModalSignal] =
    useState<number>(0);

  // --- Generar encuentros ---
  const generateEncounters = useCallback(
    async (walkRoute: Coordinate[]): Promise<Encounter[]> => {
      if (walkRoute.length < 2) return [];
      console.log(`Processing walk route with ${walkRoute.length} points...`);
      // No marcamos isProcessingWalk aquí, se hace en stopWalk

      const generatedEncountersList: Encounter[] = [];
      let distanceSinceLastCheck = 0;
      let lastCheckPoint = walkRoute[0];
      const hasShinyCharm = hasItem('shiny-charm');
      const currentShinyProbability = hasShinyCharm
        ? SHINY_PROBABILITY * SHINY_CHARM_MULTIPLIER
        : SHINY_PROBABILITY;
      if (hasShinyCharm)
        console.log('Shiny Charm active! ✨ Increased Shiny Rate.');

      for (let i = 1; i < walkRoute.length; i++) {
        const currentPoint = walkRoute[i];
        distanceSinceLastCheck += calculateDistance(
          lastCheckPoint,
          currentPoint
        );
        if (distanceSinceLastCheck >= ENCOUNTER_CHECK_DISTANCE_METERS) {
          const checksToMake = Math.floor(
            distanceSinceLastCheck / ENCOUNTER_CHECK_DISTANCE_METERS
          );
          for (let j = 0; j < checksToMake; j++) {
            // Decide si es Pokémon o Item (tu lógica existente)
            // Ejemplo: if (randomEncounterType < POKEMON_ENCOUNTER_PROBABILITY) { ... generar Pokémon ... }
            //          else if (randomEncounterType < POKEMON_ENCOUNTER_PROBABILITY + ITEM_FIND_PROBABILITY_BASE) { ... generar Item ... }
    
            // --- Bloque para Generar Item (Modificado) ---
            // Asumamos que ya decidimos que es un item (ej. basado en ITEM_FIND_PROBABILITY_BASE)
            // if (decision === 'generate_item') { // Reemplaza esto con tu condición real
            // Ejemplo de condición:
            if (Math.random() < ITEM_FIND_PROBABILITY_BASE) { // Probabilidad base de encontrar *un* item
    
                // 1. Filtrar items encontrables y calcular peso total
                let totalDifficultyWeight = 0;
                const validFindableItems = FINDABLE_ITEM_IDS.map(id => ITEMS_DB[id])
                                                          .filter(itemData => itemData && typeof itemData.findDifficulty === 'number' && itemData.findDifficulty > 0);
    
                if (validFindableItems.length === 0) {
                     console.warn("No valid findable items configured with findDifficulty > 0.");
                     continue; // Salta a la siguiente iteración si no hay items válidos
                }
    
                validFindableItems.forEach(itemData => {
                    totalDifficultyWeight += itemData.findDifficulty!; // Suma las dificultades (probabilidades)
                });
    
                // 2. Generar número aleatorio ponderado
                const randomWeight = Math.random() * totalDifficultyWeight;
    
                // 3. Seleccionar Item basado en el peso
                let selectedItemData = null;
                let currentWeightSum = 0;
                for (const itemData of validFindableItems) {
                    currentWeightSum += itemData.findDifficulty!;
                    if (randomWeight <= currentWeightSum) {
                        selectedItemData = itemData;
                        break; // Item encontrado
                    }
                }
    
                // 4. Si se seleccionó un item (debería ocurrir si totalDifficultyWeight > 0)
                if (selectedItemData) {
                     console.log(`Selected item by difficulty: ${selectedItemData.name} (Difficulty: ${selectedItemData.findDifficulty})`);
                    const quantityFound = 1; // O podrías aleatorizar la cantidad también
                    // Llama a addItem del BackpackContext
                    addItem(selectedItemData.id, quantityFound); // Asegúrate que addItem esté disponible aquí
    
                    // Crea el registro del encuentro para el resumen
                    const itemEncounter: ItemEncounter = {
                        id: `${Date.now()}-item-${selectedItemData.id}-${i}-${j}`,
                        type: 'item',
                        itemDetails: selectedItemData,
                        location: currentPoint, // Ubicación del encuentro
                        quantity: quantityFound,
                    };
                    // Añade a la lista de encuentros generados
                    // (asegúrate que esta variable exista en tu contexto)
                    generatedEncountersList.push(itemEncounter);
                } else {
                     console.warn("Weighted item selection failed, even though total weight was > 0. This shouldn't happen.");
                }
            }
            // Si no, intenta encontrar Pokémon
            else if (Math.random() < ENCOUNTER_PROBABILITY) {
              const randomPokemonId =
                Math.floor(Math.random() * NATIONAL_POKEDEX_COUNT) + 1;
              const pokemonDetails = await getPokemonDetails(randomPokemonId);
              if (pokemonDetails) {
                const isShiny = Math.random() < currentShinyProbability;
                const encounterId = `${Date.now()}-pkmn-${
                  pokemonDetails.id
                }-${i}-${j}`;
                const newPokemonEncounter: PokemonEncounter = {
                  id: encounterId,
                  type: 'pokemon',
                  pokemonDetails: pokemonDetails,
                  isShiny: isShiny,
                  location: currentPoint,
                  caught: false,
                };
                generatedEncountersList.push(newPokemonEncounter);
                updatePokedexEntry(
                  pokemonDetails.id,
                  PokedexStatus.Seen,
                  isShiny
                    ? pokemonDetails.sprites.front_shiny
                    : pokemonDetails.sprites.front_default
                );
              }
            }
          }
          distanceSinceLastCheck =
            distanceSinceLastCheck % ENCOUNTER_CHECK_DISTANCE_METERS;
        }
        lastCheckPoint = currentPoint;
      }
      console.log(
        `Finished generating encounters. Found ${generatedEncountersList.length} total.`
      );
      return generatedEncountersList;
    },
    [updatePokedexEntry, addItem, hasItem]
  ); // Dependencias: funciones de contexto

  // --- Detener caminata ---
  const stopWalk = useCallback(async () => {
    if (!isLocationTracking) return;
    stopLocationTracking(); // Detiene GPS

    const finalRoute = [...routeCoordinates]; // Copia ruta

    console.log('Starting post-walk processing...');
    setIsProcessingWalk(true); // <- INICIA procesamiento

    // Genera encuentros (puede tomar tiempo por llamadas API)
    const generatedEncounters = await generateEncounters(finalRoute);

    // Calcula distancia
    let totalWalkDistance = 0;
    if (finalRoute.length > 1) {
      for (let i = 1; i < finalRoute.length; i++) {
        totalWalkDistance += calculateDistance(
          finalRoute[i - 1],
          finalRoute[i]
        );
      }
      console.log(
        `Total distance walked: ${totalWalkDistance.toFixed(2)} meters.`
      );
      addDistanceWalked(totalWalkDistance); // Registra distancia (y posible XP)
    }

    // Establece el resumen final
    setCurrentWalkSummary({
      route: finalRoute,
      encounters: generatedEncounters,
    });

    console.log('Finished post-walk processing.');
    setIsProcessingWalk(false); // <- TERMINA procesamiento

    // Señal para abrir el modal si hubo contenido relevante
    if (generatedEncounters.length > 0 || totalWalkDistance > 10) {
      setShowSummaryModalSignal((prev) => prev + 1);
      console.log('Signaling to show summary modal.');
    } else {
      console.log('No significant results, not opening summary automatically.');
    }
  }, [
    // Dependencias
    isLocationTracking,
    stopLocationTracking,
    routeCoordinates,
    generateEncounters,
    addDistanceWalked,
  ]);

  // --- Iniciar caminata ---
  const startWalk = useCallback(() => {
    if (isLocationTracking || isProcessingWalk) return; // Evita iniciar si ya está o procesando
    setCurrentWalkSummary(null); // Limpia resumen anterior
    setShowSummaryModalSignal(0); // Resetea la señal del modal
    startLocationTracking(); // Inicia GPS
  }, [isLocationTracking, isProcessingWalk, startLocationTracking]);

  // --- Marcar como capturado ---
  const markEncounterAsCaught = useCallback((encounterId: string) => {
    setCurrentWalkSummary((prevSummary) => {
      if (!prevSummary) return null;
      return {
        ...prevSummary,
        encounters: prevSummary.encounters.map((enc) =>
          enc.id === encounterId ? { ...enc, caught: true } : enc
        ),
      };
    });
    // console.log(`Marked encounter ${encounterId} as caught.`);
  }, []);

  // --- Eliminar del resumen ---
  const removeEncounterFromSummary = useCallback((encounterId: string) => {
    setCurrentWalkSummary((prevSummary) => {
      if (!prevSummary) return null;
      const updatedEncounters = prevSummary.encounters.filter(
        (enc) => enc.id !== encounterId
      );
      console.log(
        `Removed encounter ${encounterId}. Remaining: ${updatedEncounters.length}`
      );
      return {
        ...prevSummary,
        encounters: updatedEncounters,
      };
    });
  }, []);

  // --- Valores devueltos por el hook ---
  return {
    isWalking: isLocationTracking,
    isProcessingWalk,
    currentLocation,
    walkSummary: currentWalkSummary,
    showSummaryModalSignal, // La señal para el modal
    startWalk,
    stopWalk,
    routeForMap: isLocationTracking
      ? routeCoordinates
      : currentWalkSummary?.route ?? [],
    markEncounterAsCaught,
    removeEncounterFromSummary,
  };
};
