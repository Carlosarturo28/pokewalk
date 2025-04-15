// src/hooks/usePlayerManagement.ts
import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
// Usar alias
import { PlayerStats } from '@/src/types';
import {
  calculateXPForLevel,
  MAX_PLAYER_LEVEL,
  PLAYER_STATS_STORAGE_KEY,
  XP_PER_CATCH_BASE,
  XP_PER_CATCH_SHINY_BONUS,
  XP_PER_CATCH_NEW_POKEMON_BONUS,
  XP_PER_KM_WALKED,
} from '@/src/utils/constants';

const defaultInitialStats: PlayerStats = {
  /* ... (sin cambios) ... */ level: 1,
  currentXP: 0,
  xpToNextLevel: calculateXPForLevel(1),
  totalPokemonCaught: 0,
  totalShinyCaught: 0,
  totalDistanceWalked: 0,
  profilePictureUri: null,
  playerName: 'Entrenador/a',
};

export const usePlayerManagement = () => {
  const [playerStats, setPlayerStats] =
    useState<PlayerStats>(defaultInitialStats);
  const [isLoading, setIsLoading] = useState(true);

  // --- Cargar datos del jugador (sin cambios lógicos) ---
  useEffect(() => {
    // ... (lógica existente para cargar) ...
    const loadPlayerStats = async () => {
      setIsLoading(true);
      console.log('Loading player stats...');
      try {
        const d = await AsyncStorage.getItem(PLAYER_STATS_STORAGE_KEY);
        if (d) {
          const p = JSON.parse(d) as PlayerStats;
          if (p && typeof p.level === 'number') {
            if (!p.xpToNextLevel || p.xpToNextLevel <= 0)
              p.xpToNextLevel = calculateXPForLevel(p.level);
            setPlayerStats(p);
            console.log('Player stats loaded:', p);
          } else {
            console.warn('Stored stats invalid. Using defaults.');
            setPlayerStats(defaultInitialStats);
          }
        } else {
          console.log('No player stats found, using defaults.');
          setPlayerStats(defaultInitialStats);
          await AsyncStorage.setItem(
            PLAYER_STATS_STORAGE_KEY,
            JSON.stringify(defaultInitialStats)
          );
        }
      } catch (e) {
        console.error('Failed load player stats:', e);
        setPlayerStats(defaultInitialStats);
      } finally {
        setIsLoading(false);
      }
    };
    loadPlayerStats();
  }, []);

  // --- Guardar datos del jugador (sin cambios lógicos) ---
  useEffect(() => {
    // ... (lógica existente para guardar con debounce) ...
    if (isLoading) return;
    const h = setTimeout(() => {
      console.log('Debounced save: Saving player stats...');
      (async () => {
        try {
          await AsyncStorage.setItem(
            PLAYER_STATS_STORAGE_KEY,
            JSON.stringify(playerStats)
          );
        } catch (e) {
          console.error('Failed save player stats:', e);
        }
      })();
    }, 1500);
    return () => clearTimeout(h);
  }, [playerStats, isLoading]);

  // --- Añadir XP (sin cambios lógicos) ---
  const addXP = useCallback(
    (amount: number) => {
      // ... (lógica existente para añadir XP y subir nivel) ...
      if (amount <= 0 || playerStats.level >= MAX_PLAYER_LEVEL) return;
      console.log(
        `Adding ${amount} XP. Current: ${playerStats.currentXP}/${playerStats.xpToNextLevel}`
      );
      setPlayerStats((p) => {
        let nx = p.currentXP + amount;
        let nl = p.level;
        let xfn = p.xpToNextLevel;
        while (nx >= xfn && nl < MAX_PLAYER_LEVEL) {
          nx -= xfn;
          nl++;
          xfn = calculateXPForLevel(nl);
          console.log(`Level Up! ${nl}! Next: ${xfn}`);
        }
        if (nl >= MAX_PLAYER_LEVEL) {
          nx = 0;
          xfn = 0;
          console.log('Max Level!');
        }
        return { ...p, currentXP: nx, level: nl, xpToNextLevel: xfn };
      });
    },
    [playerStats.level]
  ); // Quitar dependencias que se obtienen de prevStats

  // --- Registrar Captura (AHORA ACEPTA xpMultiplier) ---
  const recordPokemonCatch = useCallback(
    (
      isShiny: boolean,
      isNewEntry: boolean,
      xpMultiplier: number = 1.0 // <-- Acepta multiplicador con default 1
    ) => {
      // Actualizar contadores
      setPlayerStats((prevStats) => ({
        ...prevStats,
        totalPokemonCaught: prevStats.totalPokemonCaught + 1,
        totalShinyCaught: isShiny
          ? prevStats.totalShinyCaught + 1
          : prevStats.totalShinyCaught,
      }));

      // Calcular XP base
      let xpGainedBase = XP_PER_CATCH_BASE;
      if (isShiny) xpGainedBase += XP_PER_CATCH_SHINY_BONUS;
      if (isNewEntry) xpGainedBase += XP_PER_CATCH_NEW_POKEMON_BONUS;

      // Aplicar multiplicador (ej. del Huevo Suerte)
      const totalXPGained = Math.floor(xpGainedBase * xpMultiplier);

      // Añadir XP total
      addXP(totalXPGained);
      console.log(
        `Recorded catch. Shiny: ${isShiny}, New: ${isNewEntry}. BaseXP: ${xpGainedBase}, Multiplier: ${xpMultiplier}, TotalXP: ${totalXPGained}`
      );
    },
    [addXP]
  ); // Depende solo de addXP

  // --- Añadir Distancia (sin cambios lógicos) ---
  const addDistanceWalked = useCallback(
    (distanceMeters: number) => {
      // ... (lógica existente para añadir distancia y XP por KM) ...
      if (distanceMeters <= 0) return;
      setPlayerStats((p) => {
        const nd = p.totalDistanceWalked + distanceMeters;
        const kmDiff =
          Math.floor(nd / 1000) - Math.floor(p.totalDistanceWalked / 1000);
        if (kmDiff > 0) {
          const xpDist = kmDiff * XP_PER_KM_WALKED;
          addXP(xpDist);
          console.log(`Walked ${kmDiff}km. Gained ${xpDist} XP.`);
        }
        return { ...p, totalDistanceWalked: nd };
      });
    },
    [addXP]
  );

  // --- Actualizar Foto Perfil (sin cambios lógicos) ---
  const setProfilePicture = useCallback((pictureId: string | null) => {
    // Ahora guarda el ID
    // ... (lógica existente) ...
    setPlayerStats((p) => ({ ...p, profilePictureUri: pictureId }));
    console.log(`Profile picture ID set to: ${pictureId}`);
  }, []);

  // --- Actualizar Nombre (sin cambios lógicos) ---
  const setPlayerName = useCallback((name: string) => {
    // ... (lógica existente) ...
    const vn = name.trim().slice(0, 20);
    if (!vn) return;
    setPlayerStats((p) => ({ ...p, playerName: vn }));
    console.log(`Player name updated to: ${vn}`);
  }, []);

  // --- *** NUEVA FUNCIÓN: Resetear Datos del Jugador *** ---
  const resetPlayerData = useCallback(async () => {
    console.log('Resetting player stats...');
    try {
      // Borra los datos de AsyncStorage
      await AsyncStorage.removeItem(PLAYER_STATS_STORAGE_KEY);
      // Restablece el estado local a los valores por defecto
      setPlayerStats(defaultInitialStats);
      console.log('Player stats reset to default and storage cleared.');
    } catch (error) {
      console.error('Failed to reset player data:', error);
      throw error; // Propaga el error para que el llamador pueda manejarlo
    }
  }, []); // Sin dependencias, siempre usa los defaults

  return {
    playerStats,
    isLoading,
    addXP,
    recordPokemonCatch,
    addDistanceWalked,
    setProfilePicture,
    setPlayerName,
    resetPlayerData, // <-- Exportar la nueva función
  };
};
