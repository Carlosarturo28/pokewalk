// src/contexts/BackpackContext.tsx
import React, { createContext, useContext, ReactNode } from 'react';
// Usar alias
import {
  useBackpackManagement,
  BackpackState,
} from '@/src/hooks/useBackpackManagement';

interface BackpackContextProps {
  backpack: BackpackState;
  isBackpackLoading: boolean;
  addItem: (itemId: string, quantity?: number) => void;
  useItem: (itemId: string, quantity?: number) => boolean;
  hasItem: (itemId: string) => boolean;
  resetBackpackData: () => Promise<void>; // <-- Añadir reset
}

const BackpackContext = createContext<BackpackContextProps | undefined>(
  undefined
);

export const BackpackProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const backpackManagement = useBackpackManagement();

  const value: BackpackContextProps = {
    backpack: backpackManagement.backpack,
    isBackpackLoading: backpackManagement.isLoading,
    addItem: backpackManagement.addItem,
    useItem: backpackManagement.useItem,
    hasItem: backpackManagement.hasItem,
    resetBackpackData: backpackManagement.resetBackpackData, // <-- Pasar reset
  };

  return (
    <BackpackContext.Provider value={value}>
      {children}
    </BackpackContext.Provider>
  );
};

export const useBackpack = (): BackpackContextProps => {
  /* ... (sin cambios) ... */ const c = useContext(BackpackContext);
  if (c === undefined)
    throw new Error('useBackpack must be used in BackpackProvider');
  return c;
};
