import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
// Usar alias
import { ITEMS_DB } from '@/src/utils/itemData'; // Ajusta ruta
import { BACKPACK_STORAGE_KEY } from '@/src/utils/constants'; // Ajusta ruta
import { ItemId } from '@/src/types/Item'; // Asume que tienes este tipo

export type BackpackState = Map<string, number>; // string como ItemId

// Estructura para añadir múltiples items (ej. desde recompensas)
interface RewardItem {
  itemId: ItemId; // Usa tu tipo ItemId
  quantity: number;
}

// Separar la lógica de obtener los items iniciales
const getDefaultBackpackItems = (): BackpackState => {
  const initialBackpack = new Map<string, number>();
  initialBackpack.set('pokeball', 15);
  // initialBackpack.set('potion', 5);
  initialBackpack.set('razz-berry', 3);
  initialBackpack.set('poke-coin', 20);
  // Añade otros items iniciales si los tienes
  return initialBackpack;
};

export const useBackpackManagement = () => {
  const [backpack, setBackpack] = useState<BackpackState>(new Map());
  const [isLoading, setIsLoading] = useState(true);

  // --- Cargar mochila ---
  useEffect(() => {
    const loadBackpack = async () => {
      setIsLoading(true);
      // console.log('Loading backpack...');
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
            setBackpack(vm); loaded = true;
            // console.log(`Backpack loaded: ${vm.size} types.`);
          }
        }
      } catch (e) { console.error('Failed load backpack:', e); }
      if (!loaded) {
        // console.log('Using default backpack.');
        const defaults = getDefaultBackpackItems(); setBackpack(defaults);
        try { await AsyncStorage.setItem(BACKPACK_STORAGE_KEY, JSON.stringify(Array.from(defaults.entries()))); }
        catch (se) { console.error('Failed save initial backpack:', se); }
      }
      setIsLoading(false);
    };
    loadBackpack();
  }, []);

  // --- Guardar mochila ---
  useEffect(() => {
    if (isLoading) return;
    const h = setTimeout(() => {
      // console.log('Saving backpack...');
      AsyncStorage.setItem(BACKPACK_STORAGE_KEY, JSON.stringify(Array.from(backpack.entries())))
        .catch(e => console.error('Failed save backpack:', e));
    }, 1000); // Debounce
    return () => clearTimeout(h);
  }, [backpack, isLoading]);

  // --- Añadir UN Item ---
  const addItem = useCallback((itemId: string, quantity: number = 1) => {
    if (!ITEMS_DB[itemId] || quantity <= 0) {
        console.warn(`Attempted to add invalid or zero quantity item: ${itemId}`);
        return;
    }
    setBackpack((p) => {
      const n = new Map(p);
      const c = n.get(itemId) ?? 0;
      n.set(itemId, c + quantity);
      // console.log(`Added ${quantity}x ${ITEMS_DB[itemId]?.name ?? itemId}`);
      return n;
    });
  }, []);

  // --- *** NUEVA FUNCIÓN: Añadir MÚLTIPLES Items *** ---
  const addItems = useCallback((itemsToAdd: RewardItem[]) => {
    if (!itemsToAdd || itemsToAdd.length === 0) return;

    setBackpack((prevBackpack) => {
        const newBackpack = new Map(prevBackpack);
        let itemsAddedLog: string[] = [];

        itemsToAdd.forEach(item => {
            // Validaciones importantes: item existe en DB y cantidad > 0
            if (item.quantity > 0 && ITEMS_DB[item.itemId]) {
                const currentQuantity = newBackpack.get(item.itemId) ?? 0;
                newBackpack.set(item.itemId, currentQuantity + item.quantity);
                itemsAddedLog.push(`${item.quantity}x ${ITEMS_DB[item.itemId].name ?? item.itemId}`);
            } else {
               console.warn(`Skipped adding invalid item or quantity: ${JSON.stringify(item)}`);
            }
        });

        if (itemsAddedLog.length > 0) {
           console.log(`Added multiple items: ${itemsAddedLog.join(', ')}`);
        }
        return newBackpack; // Devuelve el mapa actualizado
    });
  }, []); // No necesita dependencias si usa el callback form

  // --- Usar UN Item ---
  const useItem = useCallback((itemId: string, quantity: number = 1): boolean => {
    if (!ITEMS_DB[itemId] || quantity <= 0) return false;
    let success = false;
    setBackpack((p) => {
      const c = p.get(itemId) ?? 0;
      if (c >= quantity) {
        const n = new Map(p); const nq = c - quantity;
        if (nq > 0) n.set(itemId, nq); else n.delete(itemId);
        // console.log(`Used ${quantity}x ${ITEMS_DB[itemId]?.name ?? itemId}. R: ${nq}`);
        success = true; return n;
      } else {
        console.warn(`Not enough ${ITEMS_DB[itemId]?.name ?? itemId}. N: ${quantity}, H: ${c}`);
        success = false; return p;
      }
    });
    return success;
  }, []);

  // --- Has Item ---
  const hasItem = useCallback((itemId: string) => (backpack.get(itemId) ?? 0) > 0, [backpack]);

  // --- Resetear Mochila ---
  const resetBackpackData = useCallback(async () => {
    console.log('Resetting backpack data...');
    setIsLoading(true);
    try {
      await AsyncStorage.removeItem(BACKPACK_STORAGE_KEY);
      const defaultItems = getDefaultBackpackItems();
      setBackpack(defaultItems);
      await AsyncStorage.setItem(BACKPACK_STORAGE_KEY, JSON.stringify(Array.from(defaultItems.entries())));
      console.log('Backpack reset to default and storage cleared/reset.');
    } catch (error) {
      console.error('Failed to reset backpack data:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    backpack,
    isLoading,
    addItem, // Función original
    addItems, // <-- NUEVA FUNCIÓN EXPORTADA
    useItem,
    hasItem,
    resetBackpackData,
  };
};