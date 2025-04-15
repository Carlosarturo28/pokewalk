// src/components/walk/EncounterItem.tsx
import React from 'react';
import { View, Text, Image, StyleSheet, Button } from 'react-native';
// Usar alias
import { PokemonEncounter } from '@/src/types';

// Assets
const placeholderSprite = require('../../assets/images/pokeball-placeholder.png'); // Alias
const shinyIcon = require('../../assets/images/is-shiny.png'); // Alias

interface Props {
  encounter: PokemonEncounter;
  onCapturePress: (encounter: PokemonEncounter) => void;
}

export const EncounterItem: React.FC<Props> = ({
  encounter,
  onCapturePress,
}) => {
  const spriteUri = encounter.isShiny
    ? encounter.pokemonDetails.sprites.front_shiny
    : encounter.pokemonDetails.sprites.front_default;

  return (
    <View style={styles.itemContainer}>
      <Image
        source={spriteUri ? { uri: spriteUri } : placeholderSprite}
        style={styles.sprite}
        resizeMode='contain'
      />
      <View style={styles.infoContainer}>
        {/* Nombre con icono shiny si aplica */}
        <View style={styles.nameRow}>
          <Text style={styles.nameText}>{encounter.pokemonDetails.name}</Text>
          {encounter.isShiny && (
            <Image
              source={shinyIcon}
              style={styles.inlineShinyIcon}
              resizeMode='contain'
            />
          )}
        </View>
        <Text style={styles.detailsText}>
          ID: {encounter.pokemonDetails.id}
        </Text>
      </View>
      {encounter.caught ? (
        <Text style={styles.caughtText}>¡Capturado!</Text>
      ) : (
        <Button title='Capturar' onPress={() => onCapturePress(encounter)} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderColor: '#eee',
    backgroundColor: '#fff',
  },
  sprite: { width: 50, height: 50, marginRight: 15 },
  infoContainer: { flex: 1, justifyContent: 'center' },
  // Contenedor para nombre e icono
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center', // Alinea icono y texto verticalmente
    marginBottom: 2, // Pequeño espacio antes del ID
  },
  nameText: {
    fontSize: 16,
    fontWeight: 'bold',
    textTransform: 'capitalize',
    marginRight: 5 /* Espacio antes de icono shiny */,
  },
  // Icono shiny dentro de la fila del nombre
  inlineShinyIcon: {
    width: 16,
    height: 16,
  },
  detailsText: { fontSize: 12, color: '#666' },
  caughtText: {
    fontSize: 14,
    color: 'green',
    fontWeight: 'bold',
    marginLeft: 10,
  },
});
