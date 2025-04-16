import React, { useState, useMemo } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TextInput,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  // Quitado Button si no se usa directamente aquí
} from 'react-native';
import { PokedexListItem } from '@/components/pokedex/PokedexListItem'; // Ajusta ruta
import { usePokedex } from '@/src/contexts/PokedexContext'; // Ajusta ruta
import { PokedexEntry, PokedexStatus } from '@/src/types/Pokedex'; // Ajusta ruta
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { NATIONAL_POKEDEX_COUNT } from '@/src/utils/constants'; // Ajusta ruta

import { AchievementModal } from '@/components/achievements/AchievementModal';
// Importa usePlayer para los contadores de logros (si es necesario aquí, aunque ya están en Pokedex)
// import { usePlayer } from '@/src/contexts/PlayerContext';

type StatusFilter = PokedexStatus | 'all';

export default function PokedexScreenWithAchievements() {
  const { pokedex, isPokedexLoading: isPokedexInternalLoading } = usePokedex();
  // Añadir estado de carga de Player si se usa para contadores aquí
  // const { isPlayerLoading: isPlayerContextLoading } = usePlayer();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [isAchievementModalVisible, setIsAchievementModalVisible] = useState(false);

  // Combinar estados de carga
  const isOverallLoading = isPokedexInternalLoading; // Añade || isPlayerContextLoading si usas datos de player aquí

  // useMemo para calcular datos filtrados y contadores
  const { filteredPokedexIds, seenCount, caughtCount } = useMemo(() => {
    // Usa el Map de pokedex directamente
    const pokedexArray = Array.from(pokedex.values());

    // Calcular contadores
    const currentCaughtCount = pokedexArray.filter(
      (e) => e.status === PokedexStatus.Caught
    ).length;
    const currentSeenCount = pokedexArray.filter(
      (e) => e.status === PokedexStatus.Seen
    ).length;

    // Filtrar por estado
    let statusFilteredPokemon: PokedexEntry[];
    if (statusFilter === PokedexStatus.Seen) {
      statusFilteredPokemon = pokedexArray.filter(
        (entry) => entry.status === PokedexStatus.Seen
      );
    } else if (statusFilter === PokedexStatus.Caught) {
      statusFilteredPokemon = pokedexArray.filter(
        (entry) => entry.status === PokedexStatus.Caught
      );
    } else {
      statusFilteredPokemon = pokedexArray;
    }

    // Filtrar por búsqueda
    let finalFilteredPokemon: PokedexEntry[];
    const trimmedSearchTerm = searchTerm.trim();

    if (!trimmedSearchTerm) {
      finalFilteredPokemon = statusFilteredPokemon;
    } else {
      const lowerCaseSearchTerm = trimmedSearchTerm.toLowerCase();
      finalFilteredPokemon = statusFilteredPokemon.filter((entry) => {
        if (statusFilter === 'all' && entry.status === PokedexStatus.Unknown) {
            return entry.pokemonId.toString().includes(lowerCaseSearchTerm);
        }
        else if (entry.status !== PokedexStatus.Unknown) {
            const nameMatch = entry.name.toLowerCase().includes(lowerCaseSearchTerm);
            const idMatch = entry.pokemonId.toString().includes(lowerCaseSearchTerm);
            return nameMatch || idMatch;
        }
        return false;
      });
    }

    // Ordenar y mapear a IDs
    const finalIds = finalFilteredPokemon
      .sort((a, b) => a.pokemonId - b.pokemonId)
      .map((entry) => entry.pokemonId);

    return {
      filteredPokedexIds: finalIds,
      seenCount: currentSeenCount,
      caughtCount: currentCaughtCount,
    };
  }, [pokedex, searchTerm, statusFilter]); // Dependencias correctas

  // Cálculo de Progreso
  // Usar pokedex.size como total si la pokedex se inicializa completa
  const totalPokedexEntries = pokedex.size > 0 ? pokedex.size : NATIONAL_POKEDEX_COUNT; // Más dinámico
  const progressPercent = totalPokedexEntries > 0 ? (caughtCount / totalPokedexEntries) * 100 : 0;

  // Renderizado condicional mientras carga
  if (isOverallLoading) {
    return (
        <SafeAreaView style={styles.centered}>
            <ActivityIndicator size='large' color='#FFCC00' />
            <Text>Cargando Datos...</Text>
        </SafeAreaView>
    );
  }

  // Renderizado principal
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: '#E3350D'}}>
        <Text style={styles.mainTitle}>Pokédex Nacional</Text>
        <TouchableOpacity
                  onPress={() => setIsAchievementModalVisible(true)}
                  style={{ marginRight: 15 }}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                  <Ionicons name="ribbon-outline" size={28} color="#fff" />
              </TouchableOpacity>
              </View>
        {/* Sección de Progreso */}
        <View style={styles.progressContainer}>
          <Text style={styles.progressLabel}>
            Progreso de la Pokédex: {caughtCount} / {totalPokedexEntries}
          </Text>
          <View style={styles.progressBarBackground}>
            <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
          </View>
        </View>

        {/* Contenedor de Búsqueda y Filtros */}
        <View style={styles.searchFilterContainer}>
          <View style={styles.searchWrapper}>
             <Ionicons name='search' size={20} color='#888' style={styles.searchIcon} />
             <TextInput
               style={styles.searchInput}
               placeholder='Buscar por Nombre/ID...'
               placeholderTextColor='#999'
               value={searchTerm}
               onChangeText={setSearchTerm}
               clearButtonMode='while-editing'
               autoCapitalize='none'
               autoCorrect={false}
             />
          </View>

          {/* Botones de Filtro CON CONTADORES */}
          <View style={styles.filterButtonsContainer}>
            {/* Botón Todos */}
            <TouchableOpacity
              activeOpacity={0.7}
              style={[styles.filterButton, statusFilter === 'all' && styles.filterButtonActive]}
              onPress={() => setStatusFilter('all')}
            >
              <Text style={[styles.filterButtonText, statusFilter === 'all' && styles.filterButtonTextActive]}>
                Todos
              </Text>
            </TouchableOpacity>

            {/* Botón Escapados */}
            <TouchableOpacity
              activeOpacity={0.7}
              style={[styles.filterButton, statusFilter === PokedexStatus.Seen && styles.filterButtonActive]}
              onPress={() => setStatusFilter(PokedexStatus.Seen)}
            >
              <View style={styles.filterButtonContent}>
                  <Text style={[styles.filterButtonText, statusFilter === PokedexStatus.Seen && styles.filterButtonTextActive]}>
                    Escapados
                  </Text>
                  <View style={[styles.countBadge, statusFilter === PokedexStatus.Seen && styles.countBadgeActive]}>
                    <Text style={[styles.countBadgeText, statusFilter === PokedexStatus.Seen && styles.countBadgeTextActive]}>
                      {seenCount}
                    </Text>
                  </View>
              </View>
            </TouchableOpacity>

            {/* Botón Atrapados */}
            <TouchableOpacity
              activeOpacity={0.7}
              style={[styles.filterButton, statusFilter === PokedexStatus.Caught && styles.filterButtonActive]}
              onPress={() => setStatusFilter(PokedexStatus.Caught)}
            >
               <View style={styles.filterButtonContent}>
                  <Text style={[styles.filterButtonText, statusFilter === PokedexStatus.Caught && styles.filterButtonTextActive]}>
                  Atrapados
                  </Text>
                   <View style={[styles.countBadge, statusFilter === PokedexStatus.Caught && styles.countBadgeActive]}>
                     <Text style={[styles.countBadgeText, statusFilter === PokedexStatus.Caught && styles.countBadgeTextActive]}>
                       {caughtCount}
                     </Text>
                   </View>
               </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Lista de Pokémon */}
        <FlatList
          data={filteredPokedexIds}
          renderItem={({ item: pokemonId }) => (<PokedexListItem pokemonId={pokemonId} />)}
          keyExtractor={(item) => item.toString()}
          numColumns={3}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={<Text style={styles.emptyListText}>No se encontraron Pokémon.</Text>}
          initialNumToRender={18}
          maxToRenderPerBatch={12}
          windowSize={11}
          keyboardShouldPersistTaps='handled'
        />
      </View>

      {/* Renderiza el Modal de Logros */}
      <AchievementModal
        isVisible={isAchievementModalVisible}
        onClose={() => setIsAchievementModalVisible(false)}
      />
    </SafeAreaView>
  );
}

// --- Estilos (Copia los estilos completos de la respuesta anterior) ---
const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#fff' },
    container: { flex: 1 },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
    mainTitle: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', paddingVertical: 15, marginLeft: 15, color: 'white' },
    progressContainer: { paddingVertical: 10, paddingHorizontal: 15, backgroundColor: '#f0f0f0', },
    progressLabel: { fontSize: 13, color: '#555', marginBottom: 5, fontWeight: '500', textAlign: 'center', },
    progressBarBackground: { height: 8, backgroundColor: '#e0e0e0', borderRadius: 4, overflow: 'hidden', },
    progressBarFill: { height: '100%', backgroundColor: '#4CAF50', borderRadius: 4, },
    searchFilterContainer: { padding: 10, backgroundColor: '#f8f8f8', borderBottomWidth: 1, borderColor: '#eee' },
    searchWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 8, paddingHorizontal: 10, marginBottom: 10, borderWidth: 1, borderColor: '#ddd' },
    searchIcon: { marginRight: 8 },
    searchInput: { flex: 1, height: 40, fontSize: 16, color: '#333' },
    filterButtonsContainer: { flexDirection: 'row', justifyContent: 'flex-start', alignItems: 'center' },
    filterButton: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 16, borderWidth: 1, borderColor: '#ccc', backgroundColor: '#fff', marginRight: 8, minHeight: 32, },
    filterButtonActive: { backgroundColor: '#E3350D', borderColor: '#E3350D' },
    filterButtonContent: { flexDirection: 'row', alignItems: 'center', },
    filterButtonText: { color: '#555', fontWeight: '500', fontSize: 13, marginRight: 6 },
    filterButtonTextActive: { color: '#fff', fontWeight: 'bold' },
    countBadge: { backgroundColor: '#e0e0e0', borderRadius: 10, paddingHorizontal: 6, paddingVertical: 1, minWidth: 20, height: 20, justifyContent: 'center', alignItems: 'center', marginLeft: 'auto', }, // marginLeft auto puede o no funcionar bien
    countBadgeActive: { backgroundColor: 'rgba(255, 255, 255, 0.3)', },
    countBadgeText: { color: '#444', fontSize: 11, fontWeight: 'bold', },
    countBadgeTextActive: { color: '#fff', },
    listContainer: { padding: 5 },
    emptyListText: { textAlign: 'center', marginTop: 50, fontSize: 16, color: '#666' },
});