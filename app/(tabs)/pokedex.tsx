// app/(tabs)/pokedex.tsx
import React, { useState, useMemo } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TextInput,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
// Usar alias
import { PokedexListItem } from '@/components/pokedex/PokedexListItem'; // Item individual de la lista
import { usePokedex } from '@/src/contexts/PokedexContext'; // Hook para acceder a datos Pokedex
import { PokedexEntry, PokedexStatus } from '@/src/types'; // Tipos necesarios
import { SafeAreaView } from 'react-native-safe-area-context'; // Para evitar solapamiento con UI sistema
import Ionicons from '@expo/vector-icons/Ionicons'; // Para icono de búsqueda

// Tipos para el filtro de estado ('all' | PokedexStatus.Seen | PokedexStatus.Caught)
type StatusFilter = PokedexStatus | 'all';

export default function PokedexScreenWithSearch() {
  // Obtiene datos y estado de carga del contexto Pokedex
  const { pokedex, isPokedexLoading } = usePokedex();
  // Estado para el término de búsqueda introducido por el usuario
  const [searchTerm, setSearchTerm] = useState('');
  // Estado para el filtro de estado seleccionado (Visto, Capturado, Todos)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all'); // Inicia mostrando todos

  // `useMemo` recalcula la lista filtrada solo cuando cambian las dependencias (pokedex, searchTerm, statusFilter)
  // Esto optimiza el rendimiento al no recalcular en cada renderizado.
  const filteredPokedexIds = useMemo(() => {
    // 1. Convertir el Map de la Pokédex a un array de objetos PokedexEntry
    const pokedexArray = Array.from(pokedex.values());

    // 2. Aplicar el filtro de ESTADO seleccionado por los botones
    let statusFilteredPokemon: PokedexEntry[];
    if (statusFilter === PokedexStatus.Seen) {
      // Filtra para incluir solo los 'Vistos'
      statusFilteredPokemon = pokedexArray.filter(
        (entry) => entry.status === PokedexStatus.Seen
      );
    } else if (statusFilter === PokedexStatus.Caught) {
      // Filtra para incluir solo los 'Capturados'
      statusFilteredPokemon = pokedexArray.filter(
        (entry) => entry.status === PokedexStatus.Caught
      );
    } else {
      // Si el filtro es 'all', usamos TODAS las entradas (incluyendo 'Unknown')
      statusFilteredPokemon = pokedexArray;
    }

    // 3. Aplicar el filtro de BÚSQUEDA por texto (Nombre o ID)
    let finalFilteredPokemon: PokedexEntry[];
    const trimmedSearchTerm = searchTerm.trim(); // Quitar espacios extra

    if (!trimmedSearchTerm) {
      // Si no hay texto en la barra de búsqueda, el resultado es la lista filtrada por estado
      finalFilteredPokemon = statusFilteredPokemon;
    } else {
      // Si hay texto en la barra de búsqueda:
      const lowerCaseSearchTerm = trimmedSearchTerm.toLowerCase();
      finalFilteredPokemon = statusFilteredPokemon.filter((entry) => {
        // *** CONDICIÓN IMPORTANTE ***
        // Solo se consideran para la búsqueda los Pokémon que NO son 'Unknown'
        if (entry.status === PokedexStatus.Unknown) {
          return false; // Excluye los desconocidos de los resultados de la BÚSQUEDA
        }

        // Si es 'Seen' o 'Caught', compara con el término de búsqueda
        const nameMatch = entry.name
          .toLowerCase()
          .includes(lowerCaseSearchTerm);
        const idMatch = entry.pokemonId
          .toString()
          .includes(lowerCaseSearchTerm);
        return nameMatch || idMatch; // Devuelve true si coincide nombre O ID
      });
    }

    // 4. Ordenar el resultado final por ID de Pokémon
    return (
      finalFilteredPokemon
        .sort((a, b) => a.pokemonId - b.pokemonId)
        // Mapea para obtener solo el array de IDs, que es lo que necesita FlatList
        .map((entry) => entry.pokemonId)
    );
  }, [pokedex, searchTerm, statusFilter]); // Dependencias del useMemo

  // Renderizado condicional mientras carga la Pokédex
  if (isPokedexLoading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size='large' color='#FFCC00' />
        <Text>Cargando Pokédex...</Text>
      </SafeAreaView>
    );
  }

  // Renderizado principal de la pantalla
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Título de la pantalla */}
        <Text style={styles.mainTitle}>Pokédex Nacional</Text>

        {/* Contenedor para la barra de búsqueda y los botones de filtro */}
        <View style={styles.searchFilterContainer}>
          {/* Barra de Búsqueda */}
          <View style={styles.searchWrapper}>
            <Ionicons
              name='search'
              size={20}
              color='#888'
              style={styles.searchIcon}
            />
            <TextInput
              style={styles.searchInput}
              placeholder='Buscar Conocidos por Nombre/ID...' // Placeholder actualizado
              placeholderTextColor='#999'
              value={searchTerm} // Controlado por el estado
              onChangeText={setSearchTerm} // Actualiza el estado al escribir
              clearButtonMode='while-editing' // Muestra botón 'X' para limpiar (iOS)
              autoCapitalize='none' // Evita capitalización automática
              autoCorrect={false} // Desactiva autocorrección
            />
          </View>

          {/* Botones de Filtro por Estado */}
          <View style={styles.filterButtonsContainer}>
            <TouchableOpacity
              style={[
                styles.filterButton,
                statusFilter === 'all' && styles.filterButtonActive,
              ]}
              onPress={() => setStatusFilter('all')}
            >
              {/* Botón para mostrar todos (incluyendo '?') */}
              <Text
                style={[
                  styles.filterButtonText,
                  statusFilter === 'all' && styles.filterButtonTextActive,
                ]}
              >
                Todos
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.filterButton,
                statusFilter === PokedexStatus.Seen &&
                  styles.filterButtonActive,
              ]}
              onPress={() => setStatusFilter(PokedexStatus.Seen)}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  statusFilter === PokedexStatus.Seen &&
                    styles.filterButtonTextActive,
                ]}
              >
                Vistos
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.filterButton,
                statusFilter === PokedexStatus.Caught &&
                  styles.filterButtonActive,
              ]}
              onPress={() => setStatusFilter(PokedexStatus.Caught)}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  statusFilter === PokedexStatus.Caught &&
                    styles.filterButtonTextActive,
                ]}
              >
                Capturados
              </Text>
            </TouchableOpacity>
          </View>
          {/* Futuro: Espacio para más filtros (ej. por Tipo, Generación) */}
        </View>

        {/* Lista (Cuadrícula) de Pokémon */}
        <FlatList
          data={filteredPokedexIds} // Usa los IDs filtrados y ordenados
          // Renderiza cada item usando el componente PokedexListItem
          renderItem={({ item: pokemonId }) => (
            <PokedexListItem pokemonId={pokemonId} />
          )}
          // Usa el ID del Pokémon como clave única para cada item
          keyExtractor={(item) => item.toString()}
          numColumns={3} // Muestra 3 columnas
          contentContainerStyle={styles.listContainer} // Estilo del contenedor de la lista
          // Componente a mostrar si la lista (después de filtrar) está vacía
          ListEmptyComponent={
            <Text style={styles.emptyListText}>
              No se encontraron Pokémon con esos criterios.
            </Text>
          }
          // Optimizaciones para listas largas (ajusta valores según necesidad)
          initialNumToRender={18} // Elementos a renderizar inicialmente
          maxToRenderPerBatch={12} // Elementos a renderizar por lote fuera de pantalla
          windowSize={11} // Tamaño de la ventana de renderizado
          keyboardShouldPersistTaps='handled' // Permite tocar botones mientras el teclado está abierto
        />
      </View>
    </SafeAreaView>
  );
}

// --- Estilos ---
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff', // Fondo blanco para área segura
  },
  container: {
    flex: 1, // Ocupa todo el espacio disponible
  },
  centered: {
    // Estilo para centrar contenido (ej. ActivityIndicator)
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  mainTitle: {
    // Estilo del título principal
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    paddingVertical: 15,
    backgroundColor: '#E3350D', // Rojo Pokémon
    color: 'white',
  },
  searchFilterContainer: {
    // Contenedor de búsqueda y filtros
    padding: 10,
    backgroundColor: '#f8f8f8', // Fondo gris claro
    borderBottomWidth: 1,
    borderColor: '#eee', // Borde inferior sutil
  },
  searchWrapper: {
    // Contenedor de la barra de búsqueda
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff', // Fondo blanco
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 10, // Espacio antes de los botones de filtro
    borderWidth: 1,
    borderColor: '#ddd', // Borde gris claro
  },
  searchIcon: {
    // Icono de lupa
    marginRight: 8,
  },
  searchInput: {
    // Campo de texto para buscar
    flex: 1, // Ocupa el espacio restante
    height: 40,
    fontSize: 16,
    color: '#333', // Color de texto oscuro
  },
  filterButtonsContainer: {
    // Contenedor de los botones de filtro
    flexDirection: 'row',
    justifyContent: 'flex-start', // Distribuye espacio entre botones
  },
  filterButton: {
    // Estilo base de un botón de filtro
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20, // Bordes redondeados
    borderWidth: 1,
    borderColor: '#ccc', // Borde gris
    backgroundColor: '#fff', // Fondo blanco
    marginRight: 8,
  },
  filterButtonActive: {
    // Estilo cuando un botón de filtro está activo
    backgroundColor: '#E3350D', // Fondo rojo Pokémon
    borderColor: '#E3350D', // Borde rojo
  },
  filterButtonText: {
    // Texto dentro de un botón de filtro inactivo
    color: '#555', // Gris oscuro
    fontWeight: '500',
    fontSize: 13,
  },
  filterButtonTextActive: {
    // Texto dentro de un botón de filtro activo
    color: '#fff', // Texto blanco
    fontWeight: 'bold',
  },
  listContainer: {
    // Estilo del contenedor interno de FlatList
    padding: 5, // Pequeño padding alrededor de la cuadrícula
  },
  emptyListText: {
    // Texto si la lista está vacía
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
    color: '#666', // Gris
  },
});
