import React from 'react';
import { View, Text, Image, StyleSheet, Pressable } from 'react-native';
import { Item, ItemId } from '@/src/types/Item'; // Ajusta ruta
import { useBackpack } from '@/src/contexts/BackpackContext'; // Ajusta ruta
import Ionicons from '@expo/vector-icons/Ionicons';
import { ITEMS_DB } from '@/src/utils/itemData';

const placeholderItem = require('../../assets/images/pokeball-placeholder.png'); // Ajusta ruta

interface Props {
  itemId: ItemId;
  onBuySuccess?: (itemId: ItemId, quantity: number) => void; // Callback opcional
  onBuyFail?: (message: string) => void; // Callback opcional
}

export const ShopItem: React.FC<Props> = ({ itemId, onBuySuccess, onBuyFail }) => {
  const { buyItem, backpack } = useBackpack();
  const itemData = ITEMS_DB[itemId]; // Asume ITEMS_DB está disponible o impórtalo
  const playerCoins = backpack.get('poke-coin') ?? 0;

  if (!itemData || itemData.price === undefined) {
    // No mostrar items no vendibles o mal configurados
    return null;
  }

  const handleBuyPress = () => {
    const result = buyItem(itemId, 1); // Compra de 1 en 1 por ahora
    if (result.success) {
      console.log(`Successfully bought ${itemData.name}`);
      onBuySuccess?.(itemId, 1);
      // Podrías mostrar una notificación de éxito aquí también si quieres
    } else {
      console.warn(`Failed to buy ${itemData.name}: ${result.message}`);
      onBuyFail?.(result.message);
      // Muestra notificación de error desde el hook de notificación
      // (Importa useNotification y llama a showNotification)
      // showNotification({ type: 'error', title: 'Compra Fallida', message: result.message });
    }
  };

  const canAfford = playerCoins >= itemData.price;
  const imageSource = itemData.sprite || placeholderItem;

  return (
    <View style={styles.container}>
      <Image source={imageSource} style={styles.sprite} resizeMode="contain" />
      <View style={styles.infoContainer}>
        <Text style={styles.nameText}>{itemData.name}</Text>
        <View style={styles.priceContainer}>
          <Image source={require('../../assets/images/pokecoin.png')} style={styles.coinIcon} />
          <Text style={styles.priceText}>{itemData.price}</Text>
        </View>
      </View>
      <Pressable
        style={({ pressed }) => [
            styles.buyButton,
            !canAfford && styles.buyButtonDisabled, // Estilo si no puede comprar
            pressed && canAfford && styles.buyButtonPressed // Estilo al presionar (si puede)
        ]}
        onPress={handleBuyPress}
        disabled={!canAfford} // Deshabilita si no tiene monedas
      >
        <Text style={[styles.buyButtonText, !canAfford && styles.buyButtonTextDisabled]}>
            Comprar
        </Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginVertical: 4,
    marginHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#eee',
  },
  sprite: { width: 40, height: 40, marginRight: 12 },
  infoContainer: { flex: 1, marginRight: 10 },
  nameText: { fontSize: 15, fontWeight: '600', color: '#333', marginBottom: 2 },
  priceContainer: { flexDirection: 'row', alignItems: 'center' },
  coinIcon: { width: 14, height: 14, marginRight: 4 },
  priceText: { fontSize: 14, color: '#666', fontWeight: '500' },
  buyButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#3498db', // Azul
    borderRadius: 20,
  },
  buyButtonPressed: { backgroundColor: '#2980b9' },
  buyButtonDisabled: { backgroundColor: '#bdc3c7' }, // Gris deshabilitado
  buyButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  buyButtonTextDisabled: { color: '#7f8c8d' },
});