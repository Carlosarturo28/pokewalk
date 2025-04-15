// src/components/walk/ItemEncounterItem.tsx
import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { ItemEncounter } from '@/src/types'; // Alias

// Placeholder si el item no tiene sprite definido
const placeholderItem = require('../../assets/images/pokeball-placeholder.png'); // Usa un placeholder adecuado

interface Props {
  encounter: ItemEncounter;
}

export const ItemEncounterItem: React.FC<Props> = ({ encounter }) => {
  const item = encounter.itemDetails;

  return (
    <View style={styles.itemContainer}>
      <Image
        // Usa el sprite del item o el placeholder
        source={item.sprite ? { uri: item.sprite } : placeholderItem}
        style={styles.sprite}
        resizeMode='contain'
        defaultSource={placeholderItem} // Muestra placeholder mientras carga la URI
      />
      <View style={styles.infoContainer}>
        <Text style={styles.nameText}>{item.name}</Text>
        {/* Muestra la descripción si existe */}
        {item.description && (
          <Text
            style={styles.descriptionText}
            numberOfLines={1}
            ellipsizeMode='tail'
          >
            {item.description}
          </Text>
        )}
      </View>
      {/* Muestra la cantidad encontrada (normalmente x1) */}
      <Text style={styles.quantityText}>x {encounter.quantity}</Text>
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
    backgroundColor: '#fff', // Fondo blanco para diferenciar de cabeceras
  },
  sprite: {
    width: 35, // Sprite un poco más pequeño que el de Pokémon?
    height: 35,
    marginRight: 15,
  },
  infoContainer: {
    flex: 1, // Ocupa el espacio disponible
    justifyContent: 'center',
  },
  nameText: {
    fontSize: 15,
    fontWeight: '600', // Semi-bold
    color: '#333',
  },
  descriptionText: {
    fontSize: 12,
    color: '#777', // Gris más claro para descripción
    marginTop: 2,
  },
  quantityText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#555',
    marginLeft: 10, // Separa de la info
  },
});
