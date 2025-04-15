import React, { useEffect } from 'react'; // Añadido useEffect
import {
  // Quitado Modal
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  Dimensions,
  BackHandler, // Añadido BackHandler
  TouchableWithoutFeedback, // Añadido para el overlay
} from 'react-native';
// Importa Portal de Gorhom
import { Portal } from '@gorhom/portal';
// Usar alias (Asegúrate que la ruta sea correcta)
import {
  PROFILE_PICTURES,
  ProfilePictureOption,
} from '@/src/utils/profilePictures'; // Ajusta la ruta si es necesario
import { MODAL_PORTAL_HOST } from '@/app/_layout';

interface Props {
  isVisible: boolean;
  onClose: () => void;
  onSelectPicture: (pictureId: string) => void; // Callback con el ID seleccionado
}

const { width } = Dimensions.get('window');
const NUM_COLUMNS = 3;
const itemMargin = 10;
const itemSize = (width * 0.85 - itemMargin * (NUM_COLUMNS + 1)) / NUM_COLUMNS;

export const ProfilePictureSelectorModal: React.FC<Props> = ({
  isVisible,
  onClose,
  onSelectPicture,
}) => {
  // Manejo del botón Atrás en Android
  useEffect(() => {
    const backAction = () => {
      if (isVisible) {
        onClose();
        return true; // Previene cierre de app
      }
      return false;
    };
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction
    );
    return () => backHandler.remove();
  }, [isVisible, onClose]);

  // No renderizar nada si no está visible
  if (!isVisible) {
    return null;
  }

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
    // Usa Portal de Gorhom
    <Portal hostName={MODAL_PORTAL_HOST}>
      {/* Fondo semi-transparente que cubre todo y cierra al tocar */}
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.modalOverlay}>
          {/* Contenedor del contenido visible (usa TouchableWithoutFeedback para evitar que el toque se propague y cierre) */}
          <TouchableWithoutFeedback>
            <View style={styles.modalContent}>
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
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Portal>
  );
};

// Estilos ajustados para el modal falso
const styles = StyleSheet.create({
  modalOverlay: {
    // Ocupa toda la pantalla absolutamente
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    // zIndex alto para asegurar que esté encima (opcional con Portal)
    zIndex: 100,
  },
  modalContent: {
    width: '90%',
    maxHeight: '70%',
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
    alignItems: 'center',
  },
  pictureItem: {
    width: itemSize,
    height: itemSize,
    margin: itemMargin / 2,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderRadius: itemSize / 2,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  pictureImage: {
    width: '100%',
    height: '100%',
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
