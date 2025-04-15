// src/components/profile/ProfilePictureSelectorModal.tsx (NUEVO ARCHIVO)
import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
// Usar alias
import {
  PROFILE_PICTURES,
  ProfilePictureOption,
} from '@/src/utils/profilePictures';

interface Props {
  isVisible: boolean;
  onClose: () => void;
  onSelectPicture: (pictureId: string) => void; // Callback con el ID seleccionado
}

const { width } = Dimensions.get('window');
const NUM_COLUMNS = 3;
const itemMargin = 10;
const itemSize = (width * 0.85 - itemMargin * (NUM_COLUMNS + 1)) / NUM_COLUMNS; // 85% del ancho, 3 columnas

export const ProfilePictureSelectorModal: React.FC<Props> = ({
  isVisible,
  onClose,
  onSelectPicture,
}) => {
  const renderItem = ({ item }: { item: ProfilePictureOption }) => (
    <TouchableOpacity
      style={styles.pictureItem}
      onPress={() => onSelectPicture(item.id)}
    >
      <Image
        source={item.source}
        style={styles.pictureImage}
        resizeMode='cover'
      />
    </TouchableOpacity>
  );

  return (
    <Modal
      animationType='fade' // O 'slide'
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <TouchableOpacity // Touchable para cerrar al tocar fuera del modal
        style={styles.modalOverlay}
        activeOpacity={1}
        onPressOut={onClose} // Cierra al soltar fuera del contenido
      >
        <View
          style={styles.modalContent}
          onStartShouldSetResponder={() => true}
        >
          {/* Evita que el toque en el contenido cierre el modal */}
          <Text style={styles.modalTitle}>Elige tu foto de perfil</Text>
          <FlatList
            data={PROFILE_PICTURES}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            numColumns={NUM_COLUMNS}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
          />
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Cerrar</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  modalContent: {
    width: '90%', // Ancho del modal
    maxHeight: '70%', // Altura máxima
    backgroundColor: 'white',
    borderRadius: 15,
    paddingVertical: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  listContainer: {
    // paddingHorizontal: itemMargin / 2,
    alignItems: 'center', // Centra los items si no llenan el ancho
  },
  pictureItem: {
    width: itemSize,
    height: itemSize, // Cuadrado
    margin: itemMargin / 2,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden', // Asegura que la imagen no se salga
    // backgroundColor: '#eee', // Fondo si la imagen no carga
    borderRadius: itemSize / 2, // Hacerlos circulares
    borderWidth: 1,
    borderColor: '#ccc',
  },
  pictureImage: {
    width: '100%',
    height: '100%',
  },
  pictureName: {
    // Estilo si decides mostrar el nombre
    marginTop: 5,
    fontSize: 12,
    textAlign: 'center',
  },
  closeButton: {
    marginTop: 20,
    paddingVertical: 10,
    paddingHorizontal: 25,
    backgroundColor: '#eee',
    borderRadius: 20,
  },
  closeButtonText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
});
