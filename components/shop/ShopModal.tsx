import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  BackHandler,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Portal } from '@gorhom/portal';
import Ionicons from '@expo/vector-icons/Ionicons';
// Importa datos y tipos necesarios
import { SHOP_LISTING_IDS, ITEMS_DB } from '@/src/utils/itemData'; // Ajusta ruta
import { ItemId } from '@/src/types/Item'; // Ajusta ruta
import { useBackpack } from '@/src/contexts/BackpackContext'; // Para obtener monedas actuales
import { useNotification } from '@/src/contexts/NotificationContext'; // Para notificaciones de compra
import { ShopItem } from './ShopItem'; // Componente del item individual
import { MODAL_PORTAL_HOST } from '@/app/_layout'; // Ajusta ruta

interface Props {
  isVisible: boolean;
  onClose: () => void;
}

export const ShopModal: React.FC<Props> = ({ isVisible, onClose }) => {
  const { backpack, isBackpackLoading } = useBackpack();
  const { showNotification } = useNotification();
  const playerCoins = backpack.get('poke-coin') ?? 0;

  // BackHandler
  useEffect(() => {
    const backAction = () => { if (isVisible) { onClose(); return true; } return false; };
    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, [isVisible, onClose]);

  // Filtrar y ordenar los items de la tienda (opcional)
  const shopItems = SHOP_LISTING_IDS.map(id => ITEMS_DB[id])
                                    .filter(item => item && item.price !== undefined) // Solo items con precio
                                    .sort((a, b) => (a.price ?? 0) - (b.price ?? 0)); // Ordenar por precio (asc)

  const handleBuySuccess = (itemId: ItemId, quantity: number) => {
       showNotification({
           type: 'success',
           title: '¡Compra Exitosa!',
           message: `Añadiste ${quantity} ${ITEMS_DB[itemId]?.name ?? itemId} a tu mochila.`,
           imageSource: ITEMS_DB[itemId]?.sprite || require('../../assets/images/pokeball-placeholder.png') // Ajusta ruta placeholder
       })
  };

  const handleBuyFail = (message: string) => {
       showNotification({
            type: 'error',
            title: 'Compra Fallida',
            message: message || 'No se pudo completar la compra.',
            imageSource: require('../../assets/images/toast/error.png') // Ajusta ruta error
       })
  };


  if (!isVisible) return null;

  return (
    <Portal hostName={MODAL_PORTAL_HOST}>
      {/* No cierra al tocar fuera */}
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <Pressable style={styles.closeButton} onPress={onClose} hitSlop={10}>
            <Ionicons name='close-circle' size={32} color='#666' />
          </Pressable>
          <View style={styles.header}>
             <Text style={styles.modalTitle}>Tienda Pokémon</Text>
             <View style={styles.coinDisplay}>
                  <Image source={require('../../assets/images/pokecoin.png')} style={styles.headerCoinIcon} />
                  <Text style={styles.coinText}>{playerCoins}</Text>
             </View>
          </View>

          {isBackpackLoading ? (
            <ActivityIndicator size="large" color="#3498db" style={styles.loadingIndicator}/>
          ) : (
            <FlatList
              data={shopItems}
              renderItem={({ item }) => (
                <ShopItem
                    itemId={item.id as ItemId}
                    onBuySuccess={handleBuySuccess}
                    onBuyFail={handleBuyFail}
                 />
              )}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContainer}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={<Text style={styles.emptyListText}>La tienda está vacía.</Text>}
              // Podrías añadir un separador si quieres
              // ItemSeparatorComponent={() => <View style={styles.separator} />}
            />
          )}
        </View>
      </View>
    </Portal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)', // Más oscuro para tienda?
    zIndex: 1, // Encima de otros modales y notificaciones
  },
  modalContainer: {
    width: '90%',
    maxWidth: 500, // Límite para tablets
    maxHeight: '90%',
    backgroundColor: '#fff', // Fondo blanco
    borderRadius: 15,
    // paddingTop ahora controlado por header
    paddingBottom: 15,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 10,
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
      width: '100%',
      paddingVertical: 15,
      paddingHorizontal: 20,
      borderBottomWidth: 1,
      borderBottomColor: '#eee',
      backgroundColor: '#f8f8f8', // Fondo ligero para header
      borderTopLeftRadius: 15,
      borderTopRightRadius: 15,
      flexDirection: 'row', // Para alinear título y monedas
      justifyContent: 'center', // Centra el título por defecto
      alignItems: 'center',
      position: 'relative', // Para el botón de cerrar absoluto
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    // flex: 1, // Permite que se centre si coinDisplay es absoluto
  },
  coinDisplay: {
    paddingTop: 5,
      flexDirection: 'row',
      alignItems: 'center',
      position: 'absolute', // Posiciona a la derecha
      right: 50, // Espacio desde el botón cerrar
      top: 0,
      bottom: 0, // Centra verticalmente
  },
  headerCoinIcon: { width: 18, height: 18, marginRight: 5},
  coinText: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 2 },
  closeButton: {
    position: 'absolute', top: 10, right: 10, zIndex: 1, padding: 5,
  },
   // closeButtonPressed: { opacity: 0.6 }, // Ya no se usa directamente aquí
   loadingIndicator: { flex: 1, justifyContent: 'center', alignItems: 'center'},
  listContainer: { paddingVertical: 10 },
  emptyListText: { textAlign: 'center', padding: 30, color: 'gray'},
  // separator: { height: 1, backgroundColor: '#f0f0f0', marginHorizontal: 10},
});