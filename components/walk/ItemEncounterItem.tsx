// src/components/walk/ItemEncounterItem.tsx
import React from 'react';
import { View, Text, Image, StyleSheet, ImageSourcePropType } from 'react-native';
import { Item } from '@/src/types'; // Importa el tipo Item directamente - Ajusta ruta

// Placeholder si el item no tiene sprite definido
// Asegúrate que la ruta a tu placeholder sea correcta
const placeholderItem: ImageSourcePropType = require('../../assets/images/pokeball-placeholder.png');

// Las Props ahora esperan detalles y cantidad directamente
interface Props {
  itemDetails: Item;
  quantity: number; // Esta será la cantidad total agrupada
}

// Componente para renderizar un item (agrupado) en la lista
export const ItemEncounterItem: React.FC<Props> = ({ itemDetails, quantity }) => {
  // Usamos 'item' como alias para claridad dentro del componente
  const item = itemDetails;

  // Determina la fuente de la imagen: usa el sprite si existe, si no, el placeholder
  const imageSource = item.sprite ? item.sprite : placeholderItem;

  return (
    // Contenedor principal para el item de la lista
    <View style={styles.itemContainer}>
      {/* Imagen/Sprite del item */}
      <Image
        source={imageSource}
        style={styles.sprite}
        resizeMode='contain'
      />
      {/* Contenedor para la información textual */}
      <View style={styles.infoContainer}>
        {/* Nombre del item */}
        <Text style={styles.nameText}>{item.name}</Text>
        {/* Descripción del item (si existe), limitada a una línea */}
        {item.description && (
          <Text
            style={styles.descriptionText}
            numberOfLines={1} // Limita a una línea
            ellipsizeMode='tail' // Añade '...' si el texto es muy largo
          >
            {item.description}
          </Text>
        )}
      </View>
      {/* Muestra la cantidad total encontrada */}
      <Text style={styles.quantityText}>x {quantity}</Text>
    </View>
  );
};

// --- Estilos ---
const styles = StyleSheet.create({
  itemContainer: {
    flexDirection: 'row', // Alinea elementos horizontalmente
    alignItems: 'center', // Centra elementos verticalmente
    paddingVertical: 10, // Espaciado vertical interno
    paddingHorizontal: 15, // Espaciado horizontal interno
    borderBottomWidth: 1, // Línea separadora inferior
    borderColor: '#eee', // Color de la línea separadora
    backgroundColor: '#fff', // Fondo blanco para cada item
  },
  sprite: {
    width: 35, // Ancho del sprite
    height: 35, // Alto del sprite
    marginRight: 15, // Espacio a la derecha del sprite
  },
  infoContainer: {
    flex: 1, // Permite que este contenedor ocupe el espacio restante
    justifyContent: 'center', // Centra el texto verticalmente si hay espacio extra
  },
  nameText: {
    fontSize: 15, // Tamaño de fuente para el nombre
    fontWeight: '600', // Peso semi-bold
    color: '#333', // Color de texto oscuro
    marginBottom: 1, // Pequeño espacio bajo el nombre
  },
  descriptionText: {
    fontSize: 12, // Tamaño más pequeño para la descripción
    color: '#777', // Color grisáceo
    // marginTop: 2, // Quitado para que esté más cerca del nombre
  },
  quantityText: {
    fontSize: 15, // Mismo tamaño que el nombre
    fontWeight: 'bold', // Texto en negrita para la cantidad
    color: '#555', // Color gris oscuro
    marginLeft: 10, // Espacio a la izquierda de la cantidad
    minWidth: 30, // Ancho mínimo para alinear mejor números de 1 y 2 dígitos
    textAlign: 'right', // Alinea el texto a la derecha dentro de su espacio
  },
});