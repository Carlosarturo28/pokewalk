// src/components/pokedex/PokedexListItem.tsx
import React, { useState, useEffect, useRef } from 'react'; // Añadir useRef
import {
  View,
  Text,
  Image,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  TouchableOpacity,
  ImageSourcePropType,
} from 'react-native';
import { useRouter } from 'expo-router';
// Usar alias
import { PokedexStatus } from '@/src/types';
import { usePokedex } from '@/src/contexts/PokedexContext';
import { getPokemonDetails } from '@/src/services/pokeapi';

const placeholderImage = require('../../assets/images/question-mark.webp'); // Alias
const shinyIcon = require('../../assets/images/is-shiny.png'); // Alias

interface Props {
  pokemonId: number;
}

// Tamaños (sin cambios)
const { width } = Dimensions.get('window');
const NUM_COLUMNS = 3;
const itemMargin = 5;
const itemSize = width / NUM_COLUMNS - itemMargin * 2;

export const PokedexListItem: React.FC<Props> = ({ pokemonId }) => {
  const router = useRouter();
  const { getPokedexEntry, isPokedexLoading: isPokedexContextLoading } =
    usePokedex();
  const entry = getPokedexEntry(pokemonId);

  // Estado para el sprite normal y estado de carga del sprite
  const [normalSprite, setNormalSprite] = useState<string | null>(
    entry?.spriteUrl ?? null
  ); // Inicializa con spriteUrl si existe
  const [isLoadingSprite, setIsLoadingSprite] = useState(false);
  // Ref para evitar ejecuciones múltiples del efecto si el estado cambia rápidamente
  const fetchAttempted = useRef(false);

  // --- Efecto Refactorizado para buscar Sprite Normal ---
  useEffect(() => {
    // Condiciones para NO ejecutar el efecto:
    if (
      !entry || // No hay datos de entrada
      entry.status === PokedexStatus.Unknown || // Es desconocido, usa placeholder
      entry.isCaughtShiny || // Fue capturado shiny, usa spriteUrl (que debería ser shiny)
      normalSprite !== null || // Ya tenemos el sprite normal (o sabemos que no existe 'null')
      fetchAttempted.current || // Ya intentamos buscarlo
      isLoadingSprite
    ) {
      // Ya está en proceso de búsqueda
      return; // No hacer nada
    }

    // Condiciones para SÍ ejecutar el efecto:
    // - Status es Visto o Capturado (y NO es shiny)
    // - Todavía no tenemos el sprite normal (normalSprite es null)
    // - No hemos intentado buscarlo antes
    if (
      (entry.status === PokedexStatus.Seen ||
        (entry.status === PokedexStatus.Caught && !entry.isCaughtShiny)) &&
      normalSprite === null
    ) {
      console.log(
        `PokedexListItem Effect: Fetching normal sprite for ID ${pokemonId}`
      );
      fetchAttempted.current = true; // Marcar que ya intentamos
      setIsLoadingSprite(true);

      getPokemonDetails(pokemonId)
        .then((details) => {
          const foundSprite = details?.sprites?.front_default ?? null; // Obtiene el sprite o null
          setNormalSprite(foundSprite); // Guarda el resultado (sea URL o null)
          if (!foundSprite) {
            console.warn(
              `Normal sprite fetch completed but not found for ${pokemonId}`
            );
          }
        })
        .catch((error) => {
          console.error(
            `Error fetching details for normal sprite (${pokemonId}):`,
            error
          );
          setNormalSprite(null); // Guarda null en caso de error
        })
        .finally(() => {
          setIsLoadingSprite(false); // Termina el estado de carga
        });
    }

    // Dependencias: Ejecutar solo cuando cambie la entrada del pokédex
    // Evitamos depender de 'normalSprite' o 'isLoadingSprite' para prevenir bucles.
  }, [entry]); // Depende del objeto 'entry' completo

  // --- Renderizado ---
  if (isPokedexContextLoading && !entry) {
    return (
      <View
        style={[
          styles.touchable,
          styles.itemContainer,
          styles.loadingContainer,
        ]}
      >
        <ActivityIndicator size='small' />
      </View>
    );
  }
  if (!entry) {
    return null;
  }

  const getOpacity = () => {
    /* ... */ return entry.status === PokedexStatus.Seen ? 0.6 : 1.0;
  };
  const isPlaceholder = entry.status === PokedexStatus.Unknown;
  const isCaughtShiny =
    entry.status === PokedexStatus.Caught && entry.isCaughtShiny;

  const getSpriteSource = (): ImageSourcePropType => {
    if (isPlaceholder) return placeholderImage;

    // Prioridad 1: Si fue capturado shiny, usa el sprite guardado (debería ser shiny)
    if (isCaughtShiny && entry.spriteUrl) {
      return { uri: entry.spriteUrl };
    }

    // Prioridad 2: Usa el sprite normal que buscamos/tenemos en estado local
    if (normalSprite) {
      return { uri: normalSprite };
    }

    // Prioridad 3: Si aún no tenemos el normal pero sí uno guardado (podría ser de "Visto" shiny), lo mostramos temporalmente
    // O si estamos cargando el sprite normal.
    if ((entry.spriteUrl && !isCaughtShiny) || isLoadingSprite) {
      // return entry.spriteUrl ? { uri: entry.spriteUrl } : placeholderImage;
      // Mejor mostrar placeholder mientras carga el normal para evitar mostrar shiny si solo fue visto
      return placeholderImage;
    }

    // Fallback final
    return placeholderImage;
  };

  
  const handlePress = () => {
    console.log(entry)
    if (entry.status !== PokedexStatus.Unknown) {
      router.push(`/pokemon/${entry.pokemonId}`);
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={handlePress}
      style={styles.touchable}
      disabled={isPlaceholder}
    >
      <View
        style={[styles.itemContainer, isPlaceholder ? styles.unknown : null]}
      >
        {isCaughtShiny && (
          <Text style={styles.listShinyIndicator}>
            {' '}
            <Image
              source={shinyIcon}
              style={styles.shinyIcon}
              resizeMode='contain'
            />
          </Text>
        )}
        <Image
          source={getSpriteSource()}
          style={[styles.sprite, { opacity: getOpacity() }]}
          resizeMode='contain'
          defaultSource={placeholderImage}
        />
        <Text style={styles.nameText} numberOfLines={1} ellipsizeMode='tail'>
          No. {entry.pokemonId.toString().padStart(3, '0')}{' '}
        </Text>
        <Text>{isPlaceholder ? '???' : entry.name}</Text>
        {/* Indicador de carga del sprite */}
        {isLoadingSprite && (
          <ActivityIndicator
            size='small'
            style={styles.spriteLoader}
            color='#888'
          />
        )}
      </View>
    </TouchableOpacity>
  );
};

// --- Estilos (Añadir estilo para spriteLoader) ---
const styles = StyleSheet.create({
  touchable: { flex: 1, margin: itemMargin },
  shinyIcon: { width: 20, height: 20 },
  itemContainer: {
    width: '100%',
    height: itemSize + 30,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EFEFEF',
    borderRadius: 8,
    padding: 5,
    overflow: 'hidden',
    position: 'relative',
  },
  unknown: { backgroundColor: '#DDD' },
  loadingContainer: { justifyContent: 'center', alignItems: 'center' },
  sprite: { width: itemSize * 0.7, height: itemSize * 0.7, marginBottom: 5 },
  nameText: {
    fontSize: 11,
    textAlign: 'center',
    textTransform: 'capitalize',
    fontWeight: '500',
    color: '#777',
  },
  listShinyIndicator: { position: 'absolute', top: 2, right: 4, fontSize: 12 },
  // --- Estilo para el indicador de carga del sprite ---
  spriteLoader: {
    position: 'absolute', // Poner encima del área del sprite
  },
});
