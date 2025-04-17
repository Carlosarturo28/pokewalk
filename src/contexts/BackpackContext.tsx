import React, { createContext, useContext, ReactNode } from 'react';
import {
  useBackpackManagement,
  BackpackState,
} from '@/src/hooks/useBackpackManagement'; // Ajusta ruta
// Importa el tipo RewardItem si lo necesitas globalmente, o define localmente
import { ItemId } from '@/src/types/Item'; // Ajusta ruta

// Define la estructura aquí o impórtala
interface RewardItem {
  itemId: ItemId; // Usa tu tipo ItemId (probablemente string)
  quantity: number;
}

// Actualiza la interfaz del contexto
interface BackpackContextProps {
  backpack: BackpackState;
  isBackpackLoading: boolean;
  addItem: (itemId: string, quantity?: number) => void;
  addItems: (itemsToAdd: RewardItem[]) => void; // <-- AÑADIDO
  useItem: (itemId: string, quantity?: number) => boolean;
  hasItem: (itemId: string) => boolean;
  resetBackpackData: () => Promise<void>;
  buyItem: (itemIdToBuy: ItemId, quantity?: number) => { success: boolean; message: string };
}

const BackpackContext = createContext<BackpackContextProps | undefined>(
  undefined
);

export const BackpackProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const backpackManagement = useBackpackManagement();

  // El valor ahora incluye addItems
  const value: BackpackContextProps = {
    backpack: backpackManagement.backpack,
    isBackpackLoading: backpackManagement.isLoading,
    addItem: backpackManagement.addItem,
    addItems: backpackManagement.addItems,
    buyItem: backpackManagement.buyItem,
    useItem: backpackManagement.useItem,
    hasItem: backpackManagement.hasItem,
    resetBackpackData: backpackManagement.resetBackpackData,
  };

  return (
    <BackpackContext.Provider value={value}>
      {children}
    </BackpackContext.Provider>
  );
};

// El hook useBackpack no necesita cambios
export const useBackpack = (): BackpackContextProps => {
  const c = useContext(BackpackContext);
  if (c === undefined)
    throw new Error('useBackpack must be used in BackpackProvider');
  return c;
};