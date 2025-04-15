// app/pokemon/[id].tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  ActivityIndicator,
  Button,
  TouchableOpacity,
  Platform,
  Pressable,
} from 'react-native';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
// Usar alias
import {
  getPokemonDetails,
  getPokemonSpeciesDetails,
} from '@/src/services/pokeapi';
import {
  Pokemon,
  PokemonSpecies,
  PokedexStatus,
  PokedexEntry,
} from '@/src/types';
import { SafeAreaView } from 'react-native-safe-area-context';
import { usePokedex } from '@/src/contexts/PokedexContext';
import { ITEMS_DB } from '@/src/utils/itemData';
import {
  getCaptureDifficulty,
  getDifficultyColor,
  CaptureDifficulty,
} from '@/src/utils/helpers'; // Importar helpers

// Assets
const placeholderImage = require('../../assets/images/pokeball-placeholder.png'); // Alias
const shinyIcon = require('../../assets/images/is-shiny.png'); // Alias
const pokeballPlaceholder = require('../../assets/images/pokeball-placeholder.png'); // Alias

// Traducción Status
const statusTranslation: { [key in PokedexStatus]: string } = {
  [PokedexStatus.Unknown]: 'Desconocido',
  [PokedexStatus.Seen]: 'Visto',
  [PokedexStatus.Caught]: 'Capturado',
};

// Componente TypeBadge
const TypeBadge: React.FC<{ typeName: string }> = ({ typeName }) => (
  <Text style={[styles.typeBadge, getTypeColor(typeName)]}>{typeName}</Text>
);

export default function PokemonDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { getPokedexEntry } = usePokedex();

  // Estados
  const [pokemon, setPokemon] = useState<Pokemon | null>(null);
  const [species, setSpecies] = useState<PokemonSpecies | null>(null);
  const [pokedexInfo, setPokedexInfo] = useState<PokedexEntry | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // useEffect para cargar datos
  useEffect(() => {
    const loadData = async () => {
      if (!id || isNaN(parseInt(id, 10))) {
        setError('ID inválido.');
        setIsLoading(false);
        return;
      }
      const pokemonId = parseInt(id, 10);
      const currentPokedexEntry = getPokedexEntry(pokemonId);
      setPokedexInfo(currentPokedexEntry);
      setIsLoading(true);
      setError(null);
      try {
        const [pokemonData, speciesData] = await Promise.all([
          getPokemonDetails(pokemonId), // Obtiene datos de /pokemon
          getPokemonSpeciesDetails(pokemonId), // Obtiene datos de /pokemon-species
        ]);
        if (!pokemonData || !speciesData)
          throw new Error('Datos Pokémon/Especie incompletos.');
        setPokemon(pokemonData);
        setSpecies(speciesData);
      } catch (err: any) {
        console.error('Error:', err);
        setError(err.message || 'Error al cargar.');
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [id, getPokedexEntry]);

  // Renderizado Loading/Error
  if (isLoading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size='large' color='#FFCC00' />
        <Text>Cargando...</Text>
      </SafeAreaView>
    );
  }
  if (error) {
    return (
      <SafeAreaView style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
        <Button title='Volver' onPress={() => router.back()} />
      </SafeAreaView>
    );
  }
  if (!pokemon || !species) {
    return (
      <SafeAreaView style={styles.centered}>
        <Text>No encontrado.</Text>
        <Button title='Volver' onPress={() => router.back()} />
      </SafeAreaView>
    );
  }

  // Procesamiento de Datos
  const flavorTextEntry =
    species.flavor_text_entries?.find((e) => e.language.name === 'es') ??
    species.flavor_text_entries?.find((e) => e.language.name === 'en');
  const description =
    flavorTextEntry?.flavor_text.replace(/[\n\f\s]+/g, ' ') ?? 'N/A';
  const statusText = pokedexInfo
    ? statusTranslation[pokedexInfo.status]
    : statusTranslation[PokedexStatus.Unknown];
  const wasCaughtShiny = pokedexInfo?.isCaughtShiny ?? false;
  let displaySpriteUri: string | null = pokemon.sprites.front_default;
  if (
    pokedexInfo?.status === PokedexStatus.Caught &&
    wasCaughtShiny &&
    pokedexInfo.spriteUrl
  ) {
    displaySpriteUri = pokedexInfo.spriteUrl;
  } else if (
    pokedexInfo?.status === PokedexStatus.Caught &&
    pokedexInfo.spriteUrl
  ) {
    displaySpriteUri = pokedexInfo.spriteUrl;
  }
  const ballIdUsed =
    pokedexInfo?.status === PokedexStatus.Caught
      ? pokedexInfo.caughtWithBallId
      : null;
  const ballItemData = ballIdUsed ? ITEMS_DB[ballIdUsed] : null;
  const ballSpriteUri = ballItemData?.sprite;
  const difficulty = getCaptureDifficulty(species.capture_rate);
  const difficultyColor = getDifficultyColor(difficulty);

  // Renderizado Principal
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Pressable
          onPress={() => router.navigate('/(tabs)/pokedex')}
          style={styles.backButton}
        >
          <Ionicons
            name={Platform.OS === 'ios' ? 'chevron-back' : 'arrow-back'}
            size={28}
            color={Platform.OS === 'ios' ? '#007AFF' : '#333'}
          />
          <Text style={styles.backText}>Volver a la Pokédex</Text>
        </Pressable>
        {/* Cabecera */}
        <View style={styles.header}>
          <Image
            source={
              displaySpriteUri ? { uri: displaySpriteUri } : placeholderImage
            }
            style={styles.sprite}
            resizeMode='contain'
          />
          <View style={styles.nameContainer}>
            {ballIdUsed && ballSpriteUri && (
              <Image
                source={
                  ballSpriteUri.startsWith('http')
                    ? { uri: ballSpriteUri }
                    : pokeballPlaceholder
                }
                style={styles.pokeballIcon}
                resizeMode='contain'
              />
            )}
            <Text style={styles.name}>{pokemon.name}</Text>
            {wasCaughtShiny && (
              <Image
                source={shinyIcon}
                style={styles.shinyIcon}
                resizeMode='contain'
              />
            )}
          </View>
          <Text style={styles.detailsText}>
            No. {pokemon.id.toString().padStart(3, '0')}
          </Text>
        </View>

        {/* Sección Tipos */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tipos</Text>
          <View style={styles.typesContainer}>
            {pokemon.types.map((t) => (
              <TypeBadge key={t.type.name} typeName={t.type.name} />
            ))}
          </View>
        </View>

        {/* Sección Dificultad Captura */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dificultad de Captura</Text>
          <View style={styles.difficultyContainer}>
            <Text style={[styles.difficultyText, { color: difficultyColor }]}>
              {difficulty}
            </Text>
          </View>
        </View>

        {/* Sección Descripción */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Descripción Pokédex</Text>
          <Text style={styles.descriptionText}>
            {pokedexInfo?.status === PokedexStatus.Seen
              ? 'Aún no se han obtenido datos sobre este Pokémon.'
              : description}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// --- Estilos ---
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  scrollContainer: { paddingBottom: 30 },
  header: {
    alignItems: 'center',
    paddingVertical: 20,
    backgroundColor: '#f8f8f8',
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  sprite: { width: 180, height: 180, marginBottom: 10 },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 5,
    flexWrap: 'wrap',
  },
  pokeballIcon: { width: 30, height: 30 },
  name: {
    fontSize: 28,
    fontWeight: 'bold',
    textTransform: 'capitalize',
    marginRight: 8,
  },
  shinyIcon: { width: 24, height: 24, marginLeft: 2 },
  detailsText: { fontSize: 16, color: '#555', marginTop: 4 },
  statusText: { fontStyle: 'italic', fontWeight: '600' },
  ballUsedText: {
    fontSize: 13,
    color: '#777',
    marginTop: 6,
    fontStyle: 'italic',
  },
  section: { marginTop: 20, paddingHorizontal: 15 },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    borderBottomWidth: 1,
    borderColor: '#eee',
    paddingBottom: 5,
    color: '#333',
  },
  typesContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  typeBadge: {
    paddingHorizontal: 15,
    paddingVertical: 5,
    borderRadius: 15,
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
    margin: 5,
    textTransform: 'uppercase',
    textAlign: 'center',
    minWidth: 80,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  descriptionText: { fontSize: 16, lineHeight: 24, color: '#333' },
  errorText: {
    color: 'red',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 15,
  },
  backButton: {
    marginLeft: Platform.OS === 'ios' ? 10 : 5,
    padding: 5,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    paddingTop: 20,
    paddingHorizontal: 20,
  },
  backText: {
    fontSize: 18,
    marginLeft: 6,
  },
  difficultyContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'flex-start',
    paddingVertical: 5 /* Ajusta alineación si prefieres */,
  },
  difficultyText: { fontSize: 18, fontWeight: 'bold', marginRight: 8 },
  difficultyRateText: { fontSize: 14, color: '#666' },
});

// --- Helper colores tipos ---
const typeColors: { [key: string]: string } = {
  normal: '#A8A77A',
  fire: '#EE8130',
  water: '#6390F0',
  electric: '#F7D02C',
  grass: '#7AC74C',
  ice: '#96D9D6',
  fighting: '#C22E28',
  poison: '#A33EA1',
  ground: '#E2BF65',
  flying: '#A98FF3',
  psychic: '#F95587',
  bug: '#A6B91A',
  rock: '#B6A136',
  ghost: '#735797',
  dragon: '#6F35FC',
  dark: '#705746',
  steel: '#B7B7CE',
  fairy: '#D685AD',
};
const getTypeColor = (type: string): { backgroundColor: string } => {
  return { backgroundColor: typeColors[type.toLowerCase()] || '#777' };
};
