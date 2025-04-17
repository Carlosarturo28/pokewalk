// src/hooks/useWalkManagement.ts
import { useState, useCallback } from "react";
import { Alert } from "react-native";
// Tipos necesarios
import {
  Coordinate,
  Encounter,
  PokemonEncounter,
  PokedexStatus,
  ItemEncounter,
  Item,
  WalkSummary, // Usa el tipo importado
} from "@/src/types"; // Ajusta ruta
// Hooks de Contexto y Localización
import { useLocationTracking } from "@/src/hooks/useLocationTracking"; // Ajusta ruta
import { usePokedex } from "@/src/contexts/PokedexContext"; // Ajusta ruta
import { useBackpack } from "@/src/contexts/BackpackContext"; // Ajusta ruta
import { usePlayer } from "@/src/contexts/PlayerContext"; // Ajusta ruta
import { useRemoteConfig } from "@/src/contexts/RemoteConfigContext"; // <-- NUEVO: Hook de config remota
// Servicios y Helpers
import { getPokemonDetails } from "@/src/services/pokeapi"; // Ajusta ruta
import { calculateDistance } from "@/src/utils/helpers"; // Ajusta ruta
import { ITEMS_DB, FINDABLE_ITEM_IDS } from "@/src/utils/itemData"; // Ajusta ruta
// Constantes (usadas como fallback)
import {
  ENCOUNTER_CHECK_DISTANCE_METERS,
  ENCOUNTER_PROBABILITY as DEFAULT_ENCOUNTER_PROBABILITY, // Renombrado para claridad
  SHINY_PROBABILITY as DEFAULT_SHINY_PROBABILITY, // Renombrado
  NATIONAL_POKEDEX_COUNT,
  ITEM_FIND_PROBABILITY_BASE as DEFAULT_ITEM_FIND_PROBABILITY, // Renombrado
  SHINY_CHARM_MULTIPLIER,
} from "@/src/utils/constants"; // Ajusta ruta

export const useWalkManagement = () => {
  // Hooks existentes
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
  // Hook de Config Remota
  const { activeEvent, remoteConfig } = useRemoteConfig();

  // Estados locales (sin cambios)
  const [isProcessingWalk, setIsProcessingWalk] = useState(false);
  const [currentWalkSummary, setCurrentWalkSummary] =
    useState<WalkSummary | null>(null);
  const [showSummaryModalSignal, setShowSummaryModalSignal] =
    useState<number>(0);

  // Función para intentar generar un Pokémon
  async function attemptPokemonGeneration() {
    const randomPokemonId =
      Math.floor(Math.random() * NATIONAL_POKEDEX_COUNT) + 1;
    const pokemonDetails = await getPokemonDetails(randomPokemonId);

    if (!pokemonDetails) return null;

    // Aplicar Boost de Tipo
    let spawnMultiplier = 1.0;
    const types = pokemonDetails.types.map((t) => t.type.name.toLowerCase());
    let isTargetType = false;

    if (activeEvent?.boosts?.pokemonTypeRates) {
      types.forEach((type) => {
        const eventMultiplier = activeEvent.boosts!.pokemonTypeRates![type];
        if (eventMultiplier) {
          isTargetType = true;
          if (eventMultiplier > spawnMultiplier) {
            spawnMultiplier = eventMultiplier;
          }
        }
      });
    }

    // Decidir si este Pokémon aparece basado en si es de un tipo objetivo o no
    if (isTargetType && spawnMultiplier > 1.0) {
      // Para tipos objetivo, mayor valor = mayor probabilidad de mantener
      const keepChance = spawnMultiplier / (spawnMultiplier + 1);
      if (Math.random() < keepChance) {
        console.log(
          `[Event Boost] ${
            pokemonDetails.name
          } (type boosted) spawn CONFIRMED (Multiplier: ${spawnMultiplier.toFixed(
            1
          )}x, Chance: ${keepChance.toFixed(2)})`
        );
        return pokemonDetails; // Lo mantenemos
      } else {
        console.log(
          `[Event Boost] ${
            pokemonDetails.name
          } (type boosted) spawn SKIPPED despite boost (Chance: ${keepChance.toFixed(
            2
          )})`
        );
        return null; // Lo rechazamos
      }
    } else if (activeEvent?.boosts?.pokemonTypeRates) {
      // Para tipos NO objetivo, aplicamos una penalización inversa
      const maxBoost = Math.max(
        1,
        ...Object.values(activeEvent.boosts.pokemonTypeRates)
      );
      const skipChance = 1 - 1 / maxBoost;

      if (Math.random() > skipChance) {
        console.log(
          `[Event Normal] ${
            pokemonDetails.name
          } (non-boosted type) spawn kept (SkipChance: ${skipChance.toFixed(
            2
          )})`
        );
        return pokemonDetails; // Lo mantenemos
      } else {
        console.log(
          `[Event Normal] ${
            pokemonDetails.name
          } (non-boosted type) spawn skipped (SkipChance: ${skipChance.toFixed(
            2
          )})`
        );
        return null; // Lo rechazamos
      }
    }

    return pokemonDetails; // Si no hay evento activo, siempre devolvemos el Pokémon
  }

  // --- Generar encuentros (Modificado para usar config remota) ---
  const generateEncounters = useCallback(
    async (walkRoute: Coordinate[]): Promise<Encounter[]> => {
      if (walkRoute.length < 2) return [];
      // console.log(`Processing walk route with ${walkRoute.length} points...`);

      const generatedEncountersList: Encounter[] = [];
      let distanceSinceLastCheck = 0;
      let lastCheckPoint = walkRoute[0];

      // --- Determinar probabilidades y modificadores actuales ---
      const basePokemonProb =
        remoteConfig?.defaultProbabilities?.pokemonEncounterProbability ??
        DEFAULT_ENCOUNTER_PROBABILITY;
      const baseItemProb =
        remoteConfig?.defaultProbabilities?.itemFindProbability ??
        DEFAULT_ITEM_FIND_PROBABILITY;
      let currentShinyProb =
        remoteConfig?.defaultProbabilities?.shinyProbability ??
        DEFAULT_SHINY_PROBABILITY;
      const hasShinyCharm = hasItem("shiny-charm");

      // Aplicar multiplicador de Shiny Charm (siempre)
      if (hasShinyCharm) {
        currentShinyProb *= SHINY_CHARM_MULTIPLIER;
        // console.log('Shiny Charm active!');
      }
      // Aplicar multiplicador de evento (si existe)
      if (
        activeEvent?.boosts?.shinyRateMultiplier &&
        activeEvent.boosts.shinyRateMultiplier > 0
      ) {
        currentShinyProb *= activeEvent.boosts.shinyRateMultiplier;
        console.log(
          `[Event Boost] Shiny rate multiplied by ${activeEvent.boosts.shinyRateMultiplier}. Current: ${currentShinyProb}`
        );
      }

      console.log(
        `Current Encounter Probabilities - PKMN: ${basePokemonProb}, ITEM: ${baseItemProb}, SHINY: ${currentShinyProb}`
      );

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
          distanceSinceLastCheck =
            distanceSinceLastCheck % ENCOUNTER_CHECK_DISTANCE_METERS; // Resetear sobrante

          for (let j = 0; j < checksToMake; j++) {
            const randomCheck = Math.random();
            let encounterGeneratedThisCheck = false; // Flag para evitar generar item Y pokemon en el mismo check

            // --- Intento de encontrar ITEM ---
            if (randomCheck < baseItemProb) {
              encounterGeneratedThisCheck = true; // Marca que intentamos generar item
              let totalInverseWeight = 0;
              const itemsToCheck = activeEvent?.boosts?.itemFindDifficulties
                ? Object.keys(activeEvent.boosts.itemFindDifficulties)
                : FINDABLE_ITEM_IDS;
              const validFindableItems = itemsToCheck
                .map((id) => ITEMS_DB[id])
                .filter(
                  (itemData) =>
                    itemData &&
                    typeof itemData.findDifficulty === "number" &&
                    itemData.findDifficulty > 0
                );

              if (validFindableItems.length === 0) continue;

              const itemWeights = validFindableItems.map((itemData) => {
                // Usamos el valor inverso de la dificultad para que menor dificultad = mayor probabilidad
                const difficulty =
                  activeEvent?.boosts?.itemFindDifficulties?.[itemData.id] ??
                  itemData.findDifficulty!;
                const inverseWeight = 1 / difficulty; // Invertimos para que menor dificultad = mayor peso
                totalInverseWeight += inverseWeight;
                return {
                  ...itemData,
                  currentFindDifficulty: difficulty,
                  inverseWeight,
                };
              });

              if (totalInverseWeight <= 0) continue;

              const randomWeight = Math.random() * totalInverseWeight;
              let selectedItemData = null;
              let currentWeightSum = 0;
              for (const itemData of itemWeights) {
                currentWeightSum += itemData.inverseWeight;
                if (randomWeight <= currentWeightSum) {
                  selectedItemData = itemData;
                  break;
                }
              }

              if (selectedItemData) {
                // console.log(`[Item Found] ${selectedItemData.name} (Diff: ${selectedItemData.currentFindDifficulty.toFixed(3)})`);
                const quantityFound = 1;
                addItem(selectedItemData.id, quantityFound);
                const itemEncounter: ItemEncounter = {
                  id: `${Date.now()}-item-${selectedItemData.id}-${i}-${j}`,
                  type: "item",
                  itemDetails: selectedItemData,
                  location: currentPoint,
                  quantity: quantityFound,
                };
                generatedEncountersList.push(itemEncounter);
              }
            }
            // --- Intento de encontrar POKEMON (Solo si NO se generó un item en este check) ---
            else if (
              !encounterGeneratedThisCheck &&
              randomCheck < baseItemProb + basePokemonProb
            ) {
              encounterGeneratedThisCheck = true;
              // Intentamos generar un Pokémon hasta 5 veces como máximo
              let selectedPokemon = null;
              let attempts = 0;
              const maxAttempts = 5;

              while (!selectedPokemon && attempts < maxAttempts) {
                attempts++;
                selectedPokemon = await attemptPokemonGeneration();
              }

              if (selectedPokemon) {
                // Si llegamos aquí, tenemos un Pokémon válido
                const isShiny = Math.random() < currentShinyProb;
                const encounterId = `${Date.now()}-pkmn-${
                  selectedPokemon.id
                }-${i}-${j}-${attempts}`;
                const newPokemonEncounter: PokemonEncounter = {
                  id: encounterId,
                  type: "pokemon",
                  pokemonDetails: selectedPokemon,
                  isShiny: isShiny,
                  location: currentPoint,
                  caught: false,
                };
                generatedEncountersList.push(newPokemonEncounter);
                // Llamada a Pokedex
                updatePokedexEntry(
                  selectedPokemon.id,
                  PokedexStatus.Seen,
                  isShiny
                    ? selectedPokemon.sprites.front_shiny
                    : selectedPokemon.sprites.front_default,
                  isShiny,
                  null
                );
                if (isShiny)
                  console.log(`✨ Shiny ${selectedPokemon.name} encountered!`);
                console.log(
                  `[Generation] Pokémon generated after ${attempts} attempts`
                );
              } else {
                console.log(
                  `[Generation Warning] Failed to generate a Pokémon after ${maxAttempts} attempts`
                );
              } // fin if pokemonDetails
            } // fin if generar pokemon
          } // fin for checksToMake
        } // fin if distance check
        lastCheckPoint = currentPoint;
      } // fin for ruta

      console.log(
        `Finished generating encounters. Found ${generatedEncountersList.length} total.`
      );
      return generatedEncountersList;
    },
    [
      // Dependencias existentes
      updatePokedexEntry,
      addItem,
      hasItem, // Añadido Pokedex para cálculo de tipos
      // Dependencias de Config Remota
      remoteConfig,
      activeEvent,
    ]
  );

  // --- Detener caminata (sin cambios lógicos internos, pero ahora llama a la nueva generateEncounters) ---
  const stopWalk = useCallback(async () => {
    if (!isLocationTracking) return;
    stopLocationTracking();
    const finalRoute = [...routeCoordinates];
    console.log("Starting post-walk processing...");
    setIsProcessingWalk(true);
    const generatedEncounters = await generateEncounters(finalRoute); // Llama a la función actualizada
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
      addDistanceWalked(totalWalkDistance);
    }
    setCurrentWalkSummary({
      route: finalRoute,
      encounters: generatedEncounters,
    });
    console.log("Finished post-walk processing.");
    setIsProcessingWalk(false);
    if (generatedEncounters.length > 0 || totalWalkDistance > 10) {
      setShowSummaryModalSignal((prev) => prev + 1);
      console.log("Signaling to show summary modal.");
    } else {
      console.log("No significant results, not opening summary automatically.");
    }
  }, [
    isLocationTracking,
    stopLocationTracking,
    routeCoordinates,
    generateEncounters, // Ahora depende de la nueva versión
    addDistanceWalked,
  ]);

  // --- Iniciar caminata (sin cambios) ---
  const startWalk = useCallback(() => {
    if (isLocationTracking || isProcessingWalk) return;
    setCurrentWalkSummary(null);
    setShowSummaryModalSignal(0);
    startLocationTracking();
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
    showSummaryModalSignal,
    startWalk,
    stopWalk,
    routeForMap: isLocationTracking
      ? routeCoordinates
      : currentWalkSummary?.route ?? [],
    markEncounterAsCaught,
    removeEncounterFromSummary,
  };
};
