// app/(tabs)/backpack.tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SectionList,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useBackpack } from '@/src/contexts/BackpackContext';
import { ITEMS_DB } from '@/src/utils/itemData'; // Base de datos de items
import { Item, ItemCategory } from '@/src/types'; // Tipos necesarios
import { SafeAreaView } from 'react-native-safe-area-context'; // Para evitar solapamiento con UI del sistema

// Placeholder si un item no tiene sprite definido
const placeholderItem = require('../../assets/images/pokeball-placeholder.png');

// Interfaz para definir la estructura de cada sección en la SectionList
interface BackpackSection {
  title: string; // Título de la categoría (ej. "Pokeball", "Berry")
  data: { item: Item; quantity: number }[]; // Array de objetos, cada uno con el Item y su cantidad
}

export default function BackpackScreen() {
  // Obtiene el estado de la mochila y el estado de carga desde el contexto
  const { backpack, isBackpackLoading } = useBackpack();

  // Muestra un indicador de carga mientras se recuperan los datos de AsyncStorage
  if (isBackpackLoading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size='large' color='#FFCC00' />
        <Text>Cargando mochila...</Text>
      </SafeAreaView>
    );
  }

  // --- Procesamiento para agrupar items por categoría ---
  const sections: BackpackSection[] = []; // Array final para la SectionList
  // Objeto temporal para agrupar: la clave es la categoría, el valor es un array de {item, quantity}
  const itemsByCategory: {
    [key in ItemCategory]?: { item: Item; quantity: number }[];
  } = {};

  // Itera sobre el Map 'backpack' (que contiene [itemId, quantity])
  Array.from(backpack.entries()).forEach(([itemId, quantity]) => {
    const itemData = ITEMS_DB[itemId]; // Busca los detalles del item en nuestra DB
    // Si el item existe en nuestra DB (evita errores si hay datos viejos en storage)
    if (itemData) {
      const category = itemData.category; // Obtiene la categoría del item
      // Si es la primera vez que vemos esta categoría, inicializa su array
      if (!itemsByCategory[category]) {
        itemsByCategory[category] = [];
      }
      // Añade el item y su cantidad al array de su categoría
      itemsByCategory[category]?.push({ item: itemData, quantity });
    }
  });

  // Define el orden deseado para las secciones en la lista
  const categoryOrder: ItemCategory[] = [
    'pokeball',
    'berry',
    'medicine',
    'key',
    'other',
  ];

  // Construye el array 'sections' final en el orden definido
  categoryOrder.forEach((category) => {
    // Si hay items en esta categoría y el array no está vacío
    if (itemsByCategory[category] && itemsByCategory[category]!.length > 0) {
      // Opcional: Ordenar los items DENTRO de cada categoría (ej. por dificultad o nombre)
      itemsByCategory[category]!.sort(
        (a, b) =>
          (a.item.findDifficulty ?? 999) - (b.item.findDifficulty ?? 999)
      ); // Ordena por dificultad (menor primero)

      // Añade la sección al array final
      sections.push({
        // Capitaliza el nombre de la categoría para el título
        title: category.charAt(0).toUpperCase() + category.slice(1),
        data: itemsByCategory[category]!, // Los datos son el array de {item, quantity}
      });
    }
  });

  // --- Renderizado del Componente ---
  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Título principal de la pantalla */}
      <Text style={styles.mainTitle}>Mochila</Text>

      {/* Si no hay secciones (mochila vacía), muestra un mensaje */}
      {sections.length === 0 ? (
        <View style={styles.centered}>
          <Text>Tu mochila está vacía.</Text>
        </View>
      ) : (
        // Si hay items, muestra la SectionList
        <SectionList
          sections={sections} // Los datos agrupados por categoría
          keyExtractor={(itemData) => itemData.item.id} // Clave única para cada item (ID del item)
          // Cómo renderizar cada item dentro de una sección
          renderItem={({ item: itemData }) => (
            <View style={styles.itemRow}>
              {/* Imagen del item */}
              <Image
                source={
                  itemData.item.sprite
                    ? { uri: itemData.item.sprite }
                    : placeholderItem
                }
                style={styles.itemSprite}
                resizeMode='contain'
                defaultSource={placeholderItem} // Muestra placeholder mientras carga
              />
              {/* Información del item (nombre y descripción) */}
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{itemData.item.name}</Text>
                <Text
                  style={styles.itemDescription}
                  numberOfLines={2}
                  ellipsizeMode='tail'
                >
                  {itemData.item.description ?? ''}
                </Text>
              </View>
              {/* Cantidad del item */}
              <Text style={styles.itemQuantity}>x {itemData.quantity}</Text>
            </View>
          )}
          // Cómo renderizar la cabecera de cada sección (título de categoría)
          renderSectionHeader={({ section: { title } }) => (
            <Text style={styles.sectionHeader}>{title}</Text>
          )}
          stickySectionHeadersEnabled={false} // Evita que las cabeceras se queden pegadas arriba
          contentContainerStyle={styles.listContainer} // Estilo para el contenedor del scroll
        />
      )}
    </SafeAreaView>
  );
}

// --- Estilos ---
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f5f5', // Fondo general ligeramente gris
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  mainTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    paddingVertical: 15,
    backgroundColor: '#8B4513', // Marrón tipo mochila
    color: 'white',
    borderBottomWidth: 2,
    borderBottomColor: '#5a2d0c',
  },
  listContainer: {
    paddingBottom: 20, // Espacio al final de la lista
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    backgroundColor: '#e0e0e0', // Fondo gris claro para cabeceras
    paddingVertical: 8,
    paddingHorizontal: 15,
    marginTop: 10, // Espacio sobre cada sección (excepto la primera)
    borderTopWidth: 1, // Líneas sutiles para separar
    borderBottomWidth: 1,
    borderColor: '#ccc',
    color: '#333', // Color de texto oscuro
  },
  itemRow: {
    flexDirection: 'row', // Elementos en fila
    alignItems: 'center', // Centrar verticalmente
    paddingVertical: 10,
    paddingHorizontal: 15,
    backgroundColor: '#fff', // Fondo blanco para items
    borderBottomWidth: 1, // Línea separadora entre items
    borderColor: '#eee',
  },
  itemSprite: {
    width: 40,
    height: 40,
    marginRight: 15, // Espacio entre sprite y texto
  },
  itemInfo: {
    flex: 1, // Ocupa el espacio disponible entre sprite y cantidad
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600', // Semi-bold
    color: '#222',
  },
  itemDescription: {
    fontSize: 12,
    color: '#666', // Gris para descripción
    marginTop: 2,
  },
  itemQuantity: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10, // Espacio entre info y cantidad
    color: '#444',
  },
});
