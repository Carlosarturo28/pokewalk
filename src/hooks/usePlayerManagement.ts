// src/hooks/usePlayerManagement.ts
import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
// Tipos y Constantes originales
import { PlayerStats } from '@/src/types'; // Ajusta ruta
import {
  calculateXPForLevel,
  MAX_PLAYER_LEVEL,
  PLAYER_STATS_STORAGE_KEY, // Clave para stats
  XP_PER_CATCH_BASE,
  XP_PER_CATCH_SHINY_BONUS,
  XP_PER_CATCH_NEW_POKEMON_BONUS,
  XP_PER_KM_WALKED,
} from '@/src/utils/constants'; // Ajusta ruta
// Tipos y Config de Logros
import {
  AchievementDefinition,
  AchievementProgressData,
  AchievementReward,
  AchievementCalculationType,
} from '@/src/types/Achievement'; // Ajusta ruta
import { ACHIEVEMENTS } from '@/src/config/achievements.config'; // Ajusta ruta
// Clave de Storage para Logros
const ACHIEVEMENT_PROGRESS_STORAGE_KEY = '@PokemonWalkApp:achievementProgress_v1';
// Hooks de otros contextos
import { usePokedex } from '@/src/contexts/PokedexContext'; // Ajusta ruta
import { useBackpack } from '@/src/contexts/BackpackContext'; // Ajusta ruta
import { useNotification } from '@/src/contexts/NotificationContext'; // Ajusta ruta
import { PokedexEntry, PokedexStatus } from '@/src/types/Pokedex'; // Ajusta ruta
import { getPokemonDetails } from '@/src/services/pokeapi'; // Ajusta ruta
import { ItemId } from '@/src/types/Item'; // Ajusta ruta

// Estado inicial de las stats (como lo tenías)
const defaultInitialStats: PlayerStats = {
  level: 1, currentXP: 0, xpToNextLevel: calculateXPForLevel(1),
  totalPokemonCaught: 0, totalShinyCaught: 0, totalDistanceWalked: 0,
  profilePictureUri: null, // Usa el nombre de tu tipo original
  playerName: 'Entrenador/a',
};
// Estado inicial del progreso de logros (Mapa vacío que se poblará)
const defaultInitialAchievementProgress: Map<string, AchievementProgressData> = new Map();
// Poblar con las definiciones iniciales
ACHIEVEMENTS.forEach(a => defaultInitialAchievementProgress.set(a.id, { currentValue: 0, achieved: false }));

export const usePlayerManagement = () => {
  // Estados para Stats y Logros
  const [playerStats, setPlayerStats] = useState<PlayerStats>(defaultInitialStats);
  const [achievementProgressMap, setAchievementProgressMap] = useState<Map<string, AchievementProgressData>>(new Map(defaultInitialAchievementProgress)); // Inicia con la estructura
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [isLoadingAchievements, setIsLoadingAchievements] = useState(true);

  // Hooks de otros contextos
  const { pokedex, isPokedexLoading } = usePokedex();
  const { addItems } = useBackpack(); // Asume que addItems está disponible aquí
  const { showNotification } = useNotification();

  // Estado de carga combinado
  const isLoading = isLoadingStats || isLoadingAchievements || isPokedexLoading;

  // --- Cargar Datos (Ahora carga ambos) ---
  useEffect(() => {
    const loadAllPlayerData = async () => {
      setIsLoadingStats(true);
      setIsLoadingAchievements(true);
      console.log('Loading player stats and achievement progress...');

      // Cargar Stats
      let loadedStats = { ...defaultInitialStats };
      try {
        const statsData = await AsyncStorage.getItem(PLAYER_STATS_STORAGE_KEY);
        if (statsData) {
          const parsedStats = JSON.parse(statsData) as PlayerStats;
          // Validaciones básicas y asegurar defaults si faltan
          if (parsedStats && typeof parsedStats.level === 'number') {
             if (!parsedStats.xpToNextLevel || parsedStats.xpToNextLevel <= 0) parsedStats.xpToNextLevel = calculateXPForLevel(parsedStats.level);
             parsedStats.playerName = parsedStats.playerName ?? defaultInitialStats.playerName;
             parsedStats.profilePictureUri = parsedStats.profilePictureUri === undefined ? defaultInitialStats.profilePictureUri : parsedStats.profilePictureUri;
             parsedStats.totalPokemonCaught = parsedStats.totalPokemonCaught ?? 0;
             parsedStats.totalShinyCaught = parsedStats.totalShinyCaught ?? 0;
             parsedStats.totalDistanceWalked = parsedStats.totalDistanceWalked ?? 0;
             parsedStats.currentXP = parsedStats.currentXP ?? 0;
             loadedStats = { ...defaultInitialStats, ...parsedStats }; // Combina defaults con lo cargado
             // console.log('Player stats loaded.');
          } else { console.warn('Stored stats invalid. Using defaults.'); }
        } else { console.log('No player stats found, using defaults.'); }
      } catch (e) { console.error('Failed load player stats:', e); }
      setPlayerStats(loadedStats);
      setIsLoadingStats(false);

      // Cargar Progreso de Logros
      let loadedAchievements = new Map<string, AchievementProgressData>();
      try {
        const achievData = await AsyncStorage.getItem(ACHIEVEMENT_PROGRESS_STORAGE_KEY);
        if (achievData) {
          const parsedArray: [string, AchievementProgressData][] = JSON.parse(achievData);
          if (Array.isArray(parsedArray)) {
             loadedAchievements = new Map(parsedArray);
             // console.log('Achievement progress loaded.');
          }
        }
      } catch (e) { console.error('Failed load achievement progress:', e); }
      // Siempre inicializa las entradas faltantes
      ACHIEVEMENTS.forEach(a => { if (!loadedAchievements.has(a.id)) loadedAchievements.set(a.id, { currentValue: 0, achieved: false }); });
      setAchievementProgressMap(loadedAchievements);
      setIsLoadingAchievements(false);
    };
    loadAllPlayerData();
  }, []); // Ejecutar solo al montar

  // --- Guardar Datos (Ahora guarda ambos por separado) ---
  // Guardar Stats
  useEffect(() => {
    if (isLoadingStats) return;
    const handler = setTimeout(() => {
      // console.log('Debounced save: Saving player stats...');
      AsyncStorage.setItem(PLAYER_STATS_STORAGE_KEY, JSON.stringify(playerStats))
        .catch(e => console.error('Failed save player stats:', e));
    }, 1000); // Delay un poco más corto
    return () => clearTimeout(handler);
  }, [playerStats, isLoadingStats]);

  // Guardar Logros
  useEffect(() => {
    if (isLoadingAchievements) return;
    const handler = setTimeout(() => {
      // console.log('Debounced save: Saving achievement progress...');
      AsyncStorage.setItem(ACHIEVEMENT_PROGRESS_STORAGE_KEY, JSON.stringify(Array.from(achievementProgressMap.entries())))
        .catch(e => console.error('Failed save achievement progress:', e));
    }, 1200); // Delay un poco más largo que las stats
    return () => clearTimeout(handler);
  }, [achievementProgressMap, isLoadingAchievements]);


    // --- Lógica de Logros ---
    const calculateCurrentProgress = useCallback(async (
      achievement: AchievementDefinition,
      currentTotalPokemonCaught: number // Recibe contador
    ): Promise<number> => {
        switch(achievement.calculationType) {
            case 'TOTAL_CAPTURED':
                return currentTotalPokemonCaught;
            case 'POKEDEX_CAUGHT_COUNT':
                return Array.from(pokedex.values()).filter(e => e.status === PokedexStatus.Caught).length;
            case 'POKEDEX_TYPE_CAUGHT_COUNT':
                if (!achievement.calculationTarget) return 0;
                const targetType = achievement.calculationTarget.toLowerCase();
                let typeCount = 0;
                // Itera sobre el pokedex Map directamente
                pokedex.forEach((entry: PokedexEntry) => { // Asegura tipo PokedexEntry
                    // Verifica si está capturado Y si tiene tipos guardados
                    if (entry.status === PokedexStatus.Caught && entry.types) {
                        // Extrae los nombres de los tipos guardados
                        const pokemonTypes = entry.types.map(t => t.type.name.toLowerCase());
                        if (pokemonTypes.includes(targetType)) {
                            typeCount++;
                        }
                    }
                });
                 // console.log(`[Achievement] Type ${targetType} count (from PokedexEntry): ${typeCount}`);
                return typeCount; // Devuelve el conteo
            default:
                return 0;
        }
  }, [pokedex]);


  // checkAndClaimAchievements AHORA recibe el contador actualizado
  const checkAndClaimAchievements = useCallback(async (
        updatedTotalPokemonCaught: number // Recibe el nuevo total
    ) => {
    // Usa isLoading combinado del hook
    if (isLoading) {
        // console.log("checkAndClaimAchievements skipped: Still loading.");
        return;
    }
    let updated = false;
    const newProgress = new Map(achievementProgressMap); // Copia del estado actual de logros

    for (const ach of ACHIEVEMENTS) {
      let progress = newProgress.get(ach.id);
      // Asegurarse que la entrada exista
      if (!progress) {
          progress = { currentValue: 0, achieved: false };
          newProgress.set(ach.id, progress);
          updated = true;
      }
      // Saltar si ya está logrado
      if (progress.achieved) continue;

      // Calcular progreso pasando el contador correcto
      const currentVal = await calculateCurrentProgress(ach, updatedTotalPokemonCaught);

      // Actualizar valor si cambió
      if (progress.currentValue !== currentVal) {
          progress.currentValue = currentVal;
          updated = true;
      }

      // Verificar si se alcanzó el objetivo
      if (currentVal >= ach.goal && !progress.achieved) {
        console.log(`***** Achievement Completed: ${ach.title} *****`);
        progress.achieved = true; updated = true;
        try {
          console.log("Granting rewards:", ach.rewards);
          addItems(ach.rewards); // Llama a la función del hook de backpack
          // Notificaciones...
          showNotification({ type: 'success', title: '¡Logro Completado!', message: ach.title, imageSource: ach.medalImage, duration: 5000 });
          const rewardMsg = ach.rewards.map(r => `${r.quantity}x ${r.itemId}`).join(', ');
          const itemInfoImage = require('../../assets/images/reward.png'); // AJUSTA RUTA
          setTimeout(() => { showNotification({ type: 'info', title: '¡Recompensa Obtenida!', message: rewardMsg || "¡Objetos recibidos!", imageSource: itemInfoImage}); }, 1500);
        } catch (e) {
             console.error(`Failed grant rewards for ${ach.id}:`, e);
             // Considerar revertir: progress.achieved = false; updated = false;
        }
      }
    } // Fin for

    // Si hubo cambios, actualizar el estado del MAPA DE LOGROS
    if (updated) {
      // console.log("Updating achievement progress map state.");
      setAchievementProgressMap(new Map(newProgress)); // Actualiza estado local
    }
  }, [ isLoading, achievementProgressMap, calculateCurrentProgress, addItems, showNotification, pokedex ]); // Dependencias


  // --- Funciones de PlayerStats ---
  const addXP = useCallback(
    (amount: number) => {
      if (amount <= 0) return;
      setPlayerStats((p) => {
        if (p.level >= MAX_PLAYER_LEVEL && p.xpToNextLevel <= 0) return p;
        let nx = p.currentXP + amount; let nl = p.level; let xfn = p.xpToNextLevel;
        while (xfn > 0 && nx >= xfn && nl < MAX_PLAYER_LEVEL) {
          nx -= xfn; nl++; xfn = calculateXPForLevel(nl);
          console.log(`Level Up! ${nl}! Next: ${xfn}`);
        }
        if (nl >= MAX_PLAYER_LEVEL) { xfn = 0; console.log('Max Level!'); }
        return { ...p, currentXP: nx, level: nl, xpToNextLevel: xfn };
      });
    },
    [] // Vacío si usa callback form
  );

  const addDistanceWalked = useCallback(
    (distanceMeters: number) => {
      if (distanceMeters <= 0) return;
      let xpFromDistance = 0;
      setPlayerStats((p) => {
        const nd = p.totalDistanceWalked + distanceMeters;
        const prevKm = Math.floor(p.totalDistanceWalked / 1000);
        const currentKm = Math.floor(nd / 1000);
        const kmDiff = currentKm - prevKm;
        if (kmDiff > 0) { xpFromDistance = kmDiff * XP_PER_KM_WALKED; }
        return { ...p, totalDistanceWalked: nd };
      });
      if (xpFromDistance > 0) { addXP(xpFromDistance); }
    },
    [addXP]
  );

  // Actualizar Foto Perfil (Usa ID)
  const setProfilePicture = useCallback((pictureId: string | null) => {
    setPlayerStats((p) => ({ ...p, profilePictureUri: pictureId }));
  }, []);

  // Actualizar Nombre
  const setPlayerName = useCallback((name: string) => {
    const vn = name.trim().slice(0, 20);
    if (!vn) return;
    setPlayerStats((p) => ({ ...p, playerName: vn }));
  }, []);

  // --- Registrar Captura (Modificado para pasar contador a checkAndClaim) ---
  const recordPokemonCatch = useCallback(
    ( 
      isShiny: boolean,
      isNewEntry: boolean,
      xpMultiplier: number = 1.0
    ) => {
      console.log("Hook: Recording Pokemon Catch...");

      let newTotalCaught = 0; // Variable para guardar el nuevo contador
      let calculatedXp = 0; // Variable para guardar XP calculado

      // 1. Actualizar Stats Base usando el callback de setPlayerStats
      setPlayerStats((prevStats) => {
          const updatedTotalCaught = prevStats.totalPokemonCaught + 1;
          const newShinyTotal = isShiny ? prevStats.totalShinyCaught + 1 : prevStats.totalShinyCaught;

          let xpGainedBase = XP_PER_CATCH_BASE;
          if (isShiny) xpGainedBase += XP_PER_CATCH_SHINY_BONUS;
          if (isNewEntry) xpGainedBase += XP_PER_CATCH_NEW_POKEMON_BONUS;
          calculatedXp = Math.floor(xpGainedBase * xpMultiplier);

          newTotalCaught = updatedTotalCaught; // Guarda el nuevo total calculado aquí

          // Devuelve el nuevo estado de stats
          return {
              ...prevStats,
              totalPokemonCaught: newTotalCaught,
              totalShinyCaught: newShinyTotal,
          };
      });

       // 2. Llamar a addXP DESPUÉS de actualizar el estado (si calculaste XP)
       if (calculatedXp > 0) {
           addXP(calculatedXp);
       }

      // 3. Llamar a la verificación de logros PASÁNDOLE el nuevo contador calculado
      checkAndClaimAchievements(newTotalCaught);

      // console.log(`Hook: Stats update queued. Checking achievements with count ${newTotalCaught}. XP added: ${calculatedXp}`);

    },
    [addXP, checkAndClaimAchievements] // Dependencias principales
  );


  // --- Resetear Datos (Ahora resetea ambos estados y storages) ---
  const resetPlayerData = useCallback(async () => {
    console.log('Hook: Resetting player data and achievements...');
    setIsLoadingStats(true); setIsLoadingAchievements(true);
    try {
      // Borra ambos storages
      await AsyncStorage.removeItem(PLAYER_STATS_STORAGE_KEY);
      await AsyncStorage.removeItem(ACHIEVEMENT_PROGRESS_STORAGE_KEY);
      // Restablece ambos estados locales
      setPlayerStats(defaultInitialStats);
      // Crea un nuevo mapa basado en los defaults para el reset
      const defaultAchievements = new Map<string, AchievementProgressData>();
      ACHIEVEMENTS.forEach(a => defaultAchievements.set(a.id, { currentValue: 0, achieved: false }));
      setAchievementProgressMap(defaultAchievements);
      console.log('Hook: Player data and achievements reset complete.');
    } catch (error) {
      console.error('Hook: Failed to reset player data:', error);
      // Asegurar reset del estado local incluso si falla storage
      setPlayerStats(defaultInitialStats);
      const defaultAchievements = new Map<string, AchievementProgressData>();
      ACHIEVEMENTS.forEach(a => defaultAchievements.set(a.id, { currentValue: 0, achieved: false }));
      setAchievementProgressMap(defaultAchievements);
      throw error;
    } finally {
         setIsLoadingStats(false); setIsLoadingAchievements(false);
    }
  }, []);


  // --- Función Auxiliar getAchievementProgress ---
  const getAchievementProgress = useCallback(
    (achievementId: string): AchievementProgressData | undefined => {
      return achievementProgressMap.get(achievementId);
    },
    [achievementProgressMap] // Depende del mapa local
  );


  // --- Objeto de Retorno del Hook ---
  return {
    // Stats originales
    playerStats,
    isLoading: isLoading, // Estado de carga combinado
    addXP,
    addDistanceWalked,
    setProfilePicture,
    setPlayerName,
    // Logros
    achievementProgress: achievementProgressMap, // El mapa de progreso
    isAchievementLoading: isLoadingAchievements, // Carga específica de logros
    getAchievementProgress, // Función para obtener progreso individual
    // Funciones Combinadas
    recordPokemonCatch, // Llama a la lógica interna y a checkAndClaim
    resetPlayerData,   // Resetea ambos
  };
};