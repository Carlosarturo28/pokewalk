// src/contexts/PlayerContext.tsx
import React, { createContext, useContext, ReactNode } from 'react';
// Usar alias
import { usePlayerManagement } from '@/src/hooks/usePlayerManagement';
import { PlayerStats } from '@/src/types';

interface PlayerContextProps {
  playerStats: PlayerStats;
  isPlayerLoading: boolean;
  addXP: (amount: number) => void;
  recordPokemonCatch: (
    isShiny: boolean,
    isNewEntry: boolean,
    xpMultiplier?: number
  ) => void; // Actualizar firma
  addDistanceWalked: (distanceMeters: number) => void;
  setProfilePicture: (uri: string | null) => void;
  setPlayerName: (name: string) => void;
  resetPlayerData: () => Promise<void>; // <-- Añadir reset
}

const PlayerContext = createContext<PlayerContextProps | undefined>(undefined);

export const PlayerProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const playerManagement = usePlayerManagement();

  // Asegúrate de que la firma de recordPokemonCatch coincida
  const recordCatchHandler = (
    isShiny: boolean,
    isNewEntry: boolean,
    xpMultiplier: number = 1.0
  ) => {
    playerManagement.recordPokemonCatch(isShiny, isNewEntry, xpMultiplier);
  };

  const value: PlayerContextProps = {
    playerStats: playerManagement.playerStats,
    isPlayerLoading: playerManagement.isLoading,
    addXP: playerManagement.addXP,
    recordPokemonCatch: recordCatchHandler, // Usa el handler
    addDistanceWalked: playerManagement.addDistanceWalked,
    setProfilePicture: playerManagement.setProfilePicture,
    setPlayerName: playerManagement.setPlayerName,
    resetPlayerData: playerManagement.resetPlayerData, // <-- Pasar reset
  };

  return (
    <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>
  );
};

export const usePlayer = (): PlayerContextProps => {
  const context = useContext(PlayerContext);
  if (context === undefined) {
    throw new Error('usePlayer must be used within a PlayerProvider');
  }
  return context;
};
