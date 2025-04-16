// src/hooks/useBackpackManagement.ts
import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
// Usar alias
import { ITEMS_DB } from '@/src/utils/itemData';
import { BACKPACK_STORAGE_KEY } from '@/src/utils/constants'; // Importar key

export type BackpackState = Map<string, number>;

// Separar la lógica de obtener los items iniciales
const getDefaultBackpackItems = (): BackpackState => {
  const initialBackpack = new Map<string, number>();
  initialBackpack.set('pokeball', 15);
  // initialBackpack.set('potion', 5);
  initialBackpack.set('razz-berry', 3);
  return initialBackpack;
};

export const useBackpackManagement = () => {
  const [backpack, setBackpack] = useState<BackpackState>(new Map());
  const [isLoading, setIsLoading] = useState(true);

  // --- Cargar mochila (sin cambios lógicos) ---
  useEffect(() => {
    // ... (lógica existente para cargar o usar defaults) ...
    const loadBackpack = async () => {
      setIsLoading(true);
      console.log('Loading backpack...');
      let loaded = false;
      try {
        const d = await AsyncStorage.getItem(BACKPACK_STORAGE_KEY);
        if (d) {
          const p: [string, number][] = JSON.parse(d);
          if (Array.isArray(p)) {
            const vm = new Map<string, number>();
            p.forEach(([id, q]) => {
              if (ITEMS_DB[id] && typeof q === 'number' && q > 0) vm.set(id, q);
            });
            setBackpack(vm);
            loaded = true;
            console.log(`Backpack loaded: ${vm.size} types.`);
          }
        }
      } catch (e) {
        console.error('Failed load backpack:', e);
      }
      if (!loaded) {
        console.log('Using default backpack.');
        const defaults = getDefaultBackpackItems();
        setBackpack(defaults);
        try {
          await AsyncStorage.setItem(
            BACKPACK_STORAGE_KEY,
            JSON.stringify(Array.from(defaults.entries()))
          );
        } catch (se) {
          console.error('Failed save initial backpack:', se);
        }
      }
      setIsLoading(false);
    };
    loadBackpack();
  }, []);

  // --- Guardar mochila (sin cambios) ---
  useEffect(() => {
    // ... (lógica existente de guardado con debounce) ...
    if (isLoading) return;
    const h = setTimeout(() => {
      console.log('Saving backpack...');
      (async () => {
        try {
          await AsyncStorage.setItem(
            BACKPACK_STORAGE_KEY,
            JSON.stringify(Array.from(backpack.entries()))
          );
        } catch (e) {
          console.error('Failed save backpack:', e);
        }
      })();
    }, 1000);
    return () => clearTimeout(h);
  }, [backpack, isLoading]);

  // --- Añadir Items (sin cambios) ---
  const addItem = useCallback((itemId: string, quantity: number = 1) => {
    /* ... */ if (!ITEMS_DB[itemId] || quantity <= 0) return;
    setBackpack((p) => {
      const n = new Map(p);
      const c = n.get(itemId) ?? 0;
      n.set(itemId, c + quantity);
      console.log(`Added ${quantity}x ${ITEMS_DB[itemId]?.name ?? itemId}`);
      return n;
    });
  }, []);

  // --- Usar Items (sin cambios) ---
  const useItem = useCallback(
    (itemId: string, quantity: number = 1): boolean => {
      /* ... */ if (!ITEMS_DB[itemId] || quantity <= 0) return false;
      let success = false;
      setBackpack((p) => {
        const c = p.get(itemId) ?? 0;
        if (c >= quantity) {
          const n = new Map(p);
          const nq = c - quantity;
          if (nq > 0) n.set(itemId, nq);
          else n.delete(itemId);
          console.log(
            `Used ${quantity}x ${ITEMS_DB[itemId]?.name ?? itemId}. R: ${nq}`
          );
          success = true;
          return n;
        } else {
          console.warn(
            `Not enough ${
              ITEMS_DB[itemId]?.name ?? itemId
            }. N: ${quantity}, H: ${c}`
          );
          success = false;
          return p;
        }
      });
      return success;
    },
    []
  );

  // --- Has Item (sin cambios) ---
  const hasItem = useCallback(
    /* ... */ (itemId: string) => (backpack.get(itemId) ?? 0) > 0,
    [backpack]
  );

  // --- *** NUEVA FUNCIÓN: Resetear Datos Mochila *** ---
  const resetBackpackData = useCallback(async () => {
    console.log('Resetting backpack data...');
    setIsLoading(true); // Marcar cargando durante reset
    try {
      // Borrar datos guardados
      await AsyncStorage.removeItem(BACKPACK_STORAGE_KEY);
      // Restablecer estado a los items iniciales por defecto
      const defaultItems = getDefaultBackpackItems();
      setBackpack(defaultItems);
      // Guardar los defaults para la próxima carga
      await AsyncStorage.setItem(
        BACKPACK_STORAGE_KEY,
        JSON.stringify(Array.from(defaultItems.entries()))
      );
      console.log('Backpack reset to default and storage cleared/reset.');
    } catch (error) {
      console.error('Failed to reset backpack data:', error);
      throw error; // Propagar error
    } finally {
      setIsLoading(false); // Terminar carga
    }
  }, []); // Sin dependencias

  return {
    backpack,
    isLoading,
    addItem,
    useItem,
    hasItem,
    resetBackpackData, // <-- Exportar la nueva función
  };
};
