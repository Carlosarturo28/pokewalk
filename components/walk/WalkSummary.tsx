// src/components/walk/WalkSummary.tsx
import React from 'react';
import { View, Text, SectionList, StyleSheet } from 'react-native';
// Usar alias e importar tipos necesarios
import { EncounterItem } from './EncounterItem'; // Ajusta ruta si es necesario
import { ItemEncounterItem } from './ItemEncounterItem'; // Ajusta ruta si es necesario
import {
  Encounter,
  PokemonEncounter,
  ItemEncounter,
  WalkSummary as WalkSummaryType,
  Item, // Importa el tipo Item base
} from '@/src/types'; // Ajusta ruta si es necesario

// Interfaz para los datos de la sección de items agrupados
interface GroupedItemData {
    type: 'grouped-item'; // Identificador interno
    id: string; // Usaremos itemId como ID único para la lista
    itemDetails: Item;
    totalQuantity: number;
}

// Interfaz para definir las secciones de la SectionList
interface SummarySection {
  title: string;
  data: Array<Encounter | GroupedItemData>; // Permite ambos tipos de datos
}

// Props del componente WalkSummary
interface Props {
  walkSummary: WalkSummaryType | null; // El resumen completo de la caminata
  onPokemonEncounterPress: (encounter: PokemonEncounter) => void; // Callback para captura
}

// Componente principal
export const WalkSummary: React.FC<Props> = ({
  walkSummary,
  onPokemonEncounterPress,
}) => {
  // --- Renderizado si no hay resumen o encuentros ---
  if (
    !walkSummary ||
    !walkSummary.encounters ||
    walkSummary.encounters.length === 0
  ) {
    return (
      // Contenedor para el estado vacío
      <View style={[styles.container, styles.emptyContainerView]}>
        {/* Título principal también en estado vacío */}
        <Text style={styles.mainTitle}>Resumen de la aventura</Text>
        {/* Mensaje indicando que no se encontró nada */}
        <Text style={styles.emptyText}>
          No encontraste nada en esta aventura.
        </Text>
      </View>
    );
  }

  // --- Procesamiento de Datos ---

  // Filtra solo los encuentros de Pokémon
  const pokemonEncounters = walkSummary.encounters.filter(
    (e): e is PokemonEncounter => e.type === 'pokemon'
  );

  // Filtra solo los encuentros de Items
  const itemEncounters = walkSummary.encounters.filter(
    (e): e is ItemEncounter => e.type === 'item'
  );

  // Agrupa los items por ID y suma sus cantidades
  const groupedItemsMap = new Map<string, GroupedItemData>();
  itemEncounters.forEach((encounter) => {
    const itemId = encounter.itemDetails.id; // ID del item
    const existingGroup = groupedItemsMap.get(itemId);

    if (existingGroup) {
      // Si ya existe, suma la cantidad
      existingGroup.totalQuantity += encounter.quantity;
    } else {
      // Si es nuevo, crea la entrada agrupada
      groupedItemsMap.set(itemId, {
        type: 'grouped-item',
        id: itemId, // Usa el ID del item como clave única para la lista
        itemDetails: encounter.itemDetails,
        totalQuantity: encounter.quantity,
      });
    }
  });
  // Convierte el Map de items agrupados a un Array
  const groupedItemArray = Array.from(groupedItemsMap.values());

  // --- Creación de Secciones para SectionList ---
  const sections: SummarySection[] = [];
  // Añade sección de Pokémon si hay alguno
  if (pokemonEncounters.length > 0) {
    sections.push({ title: 'Pokémon Encontrados', data: pokemonEncounters });
  }
  // Añade sección de Items si hay alguno (agrupado)
  if (groupedItemArray.length > 0) {
    sections.push({ title: 'Objetos Obtenidos', data: groupedItemArray });
  }

  // --- Renderizado del Componente con SectionList ---
  return (
    <View style={styles.container}>
      <SectionList
        sections={sections} // Pasa las secciones creadas
        // Extrae una clave única para cada item (Pokémon o Item Agrupado)
        // Usamos id + index para mayor seguridad contra posibles colisiones
        keyExtractor={(item, index) => item.id + index}
        // Renderiza el componente apropiado según el tipo de item
        renderItem={({ item }) => {
          if (item.type === 'pokemon') {
            // Renderiza el componente para Pokémon
            return (
              <EncounterItem
                encounter={item as PokemonEncounter}
                onCapturePress={onPokemonEncounterPress}
              />
            );
          } else if (item.type === 'grouped-item') {
            // Renderiza el componente para Item, pasando detalles y cantidad total
            const groupedItem = item as GroupedItemData;
            return (
              <ItemEncounterItem
                itemDetails={groupedItem.itemDetails}
                quantity={groupedItem.totalQuantity}
              />
            );
          }
          // Fallback (no debería ocurrir)
          return null;
        }}
        // Renderiza el encabezado para cada sección
        renderSectionHeader={({ section: { title } }) => (
          <Text style={styles.sectionHeader}>{title}</Text>
        )}
        // Renderiza el título principal encima de toda la lista
        ListHeaderComponent={
          <Text style={styles.mainTitle}>Resumen de la aventura</Text>
        }
        // Decide si los encabezados de sección se quedan fijos al hacer scroll
        stickySectionHeadersEnabled={false} // Cambia a true si prefieres headers pegajosos
        // Estilo para el contenedor interno de la lista
        contentContainerStyle={styles.listContentContainer}
        // Componente a mostrar si `sections` está vacío (poco probable con la lógica actual)
        ListEmptyComponent={
             <Text style={styles.emptyText}>Algo salió mal, no hay datos.</Text>
        }
      />
    </View>
  );
};

// --- Estilos ---
const styles = StyleSheet.create({
  container: {
    flex: 1, // Ocupa el espacio disponible en su contenedor padre
    backgroundColor: '#f8f8f8', // Fondo general
  },
  emptyContainerView: { // Estilos adicionales para el contenedor vacío
      flex: 1,
      justifyContent: 'flex-start', // Alinea título arriba
      alignItems: 'center', // Centra texto vacío
  },
  listContentContainer: {
    paddingBottom: 20, // Espacio al final
  },
  mainTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    padding: 15,
    backgroundColor: '#eee', // Fondo del título principal
    textAlign: 'center',
    // Considera quitar bordes si no está dentro de un modal que los requiera
    // borderTopLeftRadius: 20,
    // borderTopRightRadius: 20,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    paddingTop: 15,
    paddingBottom: 8,
    paddingHorizontal: 15,
    backgroundColor: '#f0f0f0', // Fondo ligeramente diferente para cabecera de sección
    color: '#444',
    borderBottomWidth: 1, // Línea separadora
    borderBottomColor: '#ddd',
    // borderTopWidth: 1, // Opcional: línea superior también
    // borderTopColor: '#ddd',
  },
  emptyText: {
    padding: 40, // Más espacio alrededor del texto vacío
    textAlign: 'center',
    color: '#666',
    fontSize: 16,
  },
});