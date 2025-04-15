// src/contexts/WalkContext.tsx
import React, { createContext, useContext, ReactNode } from 'react';
// Usar alias
import {
  Coordinate,
  Encounter,
  WalkSummary as WalkSummaryType,
} from '@/src/types';
import { useWalkManagement } from '@/src/hooks/useWalkManagement';

// Interfaz del contexto (incluye la señal)
interface WalkContextProps {
  isWalking: boolean;
  isProcessingWalk: boolean;
  currentLocation: Coordinate | null;
  walkSummary: WalkSummaryType | null;
  showSummaryModalSignal: number; // <-- Señal numérica
  routeForMap: Coordinate[];
  startWalk: () => void;
  stopWalk: () => Promise<void>;
  markEncounterAsCaught: (encounterId: string) => void;
  removeEncounterFromSummary: (encounterId: string) => void;
}

// Crea el contexto
const WalkContext = createContext<WalkContextProps | undefined>(undefined);

// Crea el Provider
export const WalkProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  // Obtiene todo el estado y funciones del hook useWalkManagement
  const walkManagement = useWalkManagement();

  // El valor del contexto es directamente el objeto devuelto por el hook
  return (
    <WalkContext.Provider value={walkManagement}>
      {children}
    </WalkContext.Provider>
  );
};

// Hook personalizado para consumir el contexto
export const useWalk = (): WalkContextProps => {
  const context = useContext(WalkContext);
  if (context === undefined) {
    throw new Error('useWalk must be used within a WalkProvider');
  }
  return context;
};
