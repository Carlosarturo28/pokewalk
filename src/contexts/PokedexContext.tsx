// src/contexts/PokedexContext.tsx
import React, { createContext, useContext, ReactNode } from 'react';
// Usar alias
import { usePokedexManagement } from '@/src/hooks/usePokedexManagement';
import { PokedexEntry, PokedexStatus, PokemonTypeInfo } from '@/src/types';

interface PokedexContextProps {
  pokedex: Map<number, PokedexEntry>;
  isPokedexLoading: boolean;
  // Añadimos caughtWithBallId como último parámetro opcional
  updatePokedexEntry: (
    pokemonId: number,
    newStatus: PokedexStatus,
    spriteUrl?: string | null,
    isCaughtShiny?: boolean,
    caughtWithBallId?: string | null,
    pokemonTypes?: PokemonTypeInfo[]
  ) => void;
  getPokemonStatus: (pokemonId: number) => PokedexStatus;
  getPokedexEntry: (pokemonId: number) => PokedexEntry | undefined;
  resetPokedexData: () => Promise<void>;
}

const PokedexContext = createContext<PokedexContextProps | undefined>(
  undefined
);

export const PokedexProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const pokedexManagement = usePokedexManagement(); // Hook devuelve la función actualizada

  const value: PokedexContextProps = {
    pokedex: pokedexManagement.pokedex,
    isPokedexLoading: pokedexManagement.isLoading,
    updatePokedexEntry: pokedexManagement.updatePokedexEntry, // Pasa la función del hook
    getPokemonStatus: pokedexManagement.getPokemonStatus,
    getPokedexEntry: pokedexManagement.getPokedexEntry,
    resetPokedexData: pokedexManagement.resetPokedexData,
  };

  return (
    <PokedexContext.Provider value={value}>{children}</PokedexContext.Provider>
  );
};

export const usePokedex = (): PokedexContextProps => {
  const c = useContext(PokedexContext);
  if (!c) throw new Error('usePokedex needs Provider');
  return c;
};
