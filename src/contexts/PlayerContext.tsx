// src/contexts/PlayerContext.tsx
import React, { createContext, useContext, ReactNode } from 'react';
// Hook que ahora contiene TODA la lógica
import { usePlayerManagement } from '@/src/hooks/usePlayerManagement'; // Ajusta ruta
// Tipos necesarios para la interfaz del contexto
import { PlayerStats } from '@/src/types'; // Ajusta ruta
import { AchievementProgressData } from '@/src/types/Achievement'; // Ajusta ruta

// --- Interfaz del Contexto (Refleja lo que retorna el hook) ---
interface PlayerContextProps {
  // De PlayerStats
  playerStats: PlayerStats;
  isPlayerLoading: boolean; // Combinado del hook
  addXP: (amount: number) => void;
  addDistanceWalked: (distanceMeters: number) => void;
  setProfilePicture: (pictureId: string | null) => void;
  setPlayerName: (name: string) => void;
  // De Logros
  achievementProgress: Map<string, AchievementProgressData>;
  isAchievementLoading: boolean; // Carga específica del hook
  getAchievementProgress: (achievementId: string) => AchievementProgressData | undefined;
  // Funciones Combinadas
  recordPokemonCatch: ( isShiny: boolean, isNewEntry: boolean, xpMultiplier?: number ) => void;
  resetPlayerData: () => Promise<void>;
}

const PlayerContext = createContext<PlayerContextProps | undefined>(undefined);

export const PlayerProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  // Usa el hook que ahora tiene toda la lógica
  const playerManagement = usePlayerManagement();

  // El valor del contexto es directamente lo que retorna el hook
  const value: PlayerContextProps = {
    playerStats: playerManagement.playerStats,
    isPlayerLoading: playerManagement.isLoading, // Usa el combinado
    addXP: playerManagement.addXP,
    addDistanceWalked: playerManagement.addDistanceWalked,
    setProfilePicture: playerManagement.setProfilePicture,
    setPlayerName: playerManagement.setPlayerName,
    achievementProgress: playerManagement.achievementProgress,
    isAchievementLoading: playerManagement.isAchievementLoading,
    getAchievementProgress: playerManagement.getAchievementProgress,
    recordPokemonCatch: playerManagement.recordPokemonCatch,
    resetPlayerData: playerManagement.resetPlayerData,
  };

  return (
    <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>
  );
};

// Hook usePlayer (sin cambios)
export const usePlayer = (): PlayerContextProps => {
  const context = useContext(PlayerContext);
  if (context === undefined) {
    throw new Error('usePlayer must be used within a PlayerProvider');
  }
  return context;
};