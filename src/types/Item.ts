// src/types/Item.ts

// Categorías para organizar la mochila
export type ItemCategory = 'pokeball' | 'berry' | 'medicine' | 'key' | 'other' | 'money';

// Define posibles efectos que un item puede tener
export interface ItemEffect {
  // Efecto en la tasa de captura (ej. Bayas)
  catchRateModifier?: number; // Multiplicador (ej. 1.5 para Razz)

  // Efecto en la tasa de aparición de Shiny (ej. Shiny Charm)
  shinyRateMultiplier?: number; // Multiplicador (ej. 3)

  // Podrías añadir más efectos según necesites:
  // - healAmount?: number; (para Pociones)
  // - statusCure?: string; (para Antídotos, etc.)
  // - preventsFlee?: boolean; (para Bloque Balls - no aplicable aquí)
  // - etc.
}

export type ItemId = 'pokeball' | 'ultraball' | 'greatball' | 'masterball' | 'razz-berry' | 'nanab-berry' | 'shiny-charm' | 'potion'|'lucky-egg'| 'golden-razz-berry' | 'poke-coin'

// Interfaz principal para definir un Item
export interface Item {
  id: string; // ID único basado en texto (ej. 'pokeball', 'razz-berry')
  name: string; // Nombre legible del item
  sprite: { uri: string } | number; // URL o require() a la imagen del item
  category: ItemCategory; // Categoría para agrupar en la mochila
  description?: string; // Descripción corta para mostrar al usuario
  effect?: ItemEffect; // Objeto que define los efectos del item (si los tiene)
  findDifficulty?: number; // Valor numérico para calcular probabilidad de encontrarlo (1=común, 10+=raro)
  price?: number;
  // Podrías añadir un flag 'consumable': boolean si fuera necesario diferenciar
}
