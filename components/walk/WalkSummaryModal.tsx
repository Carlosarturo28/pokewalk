import React, { useEffect } from 'react'; // Añadido useEffect
import {
  // Quitado Modal
  View,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  BackHandler, // Añadido BackHandler
} from 'react-native';
// Importa Portal de Gorhom
import { Portal } from '@gorhom/portal';
import Ionicons from '@expo/vector-icons/Ionicons';
// Usar alias e importar WalkSummary desde types (Asegúrate que la ruta sea correcta)
import { WalkSummary as WalkSummaryType, PokemonEncounter } from '@/src/types';
import { WalkSummary } from './WalkSummary'; // Importa el componente de lista
import { MODAL_PORTAL_HOST } from '@/app/_layout';

interface Props {
  isVisible: boolean;
  onClose: () => void;
  walkSummary: WalkSummaryType | null;
  onPokemonEncounterPress: (encounter: PokemonEncounter) => void;
}

const { height } = Dimensions.get('window');

export const WalkSummaryModal: React.FC<Props> = ({
  isVisible,
  onClose,
  walkSummary,
  onPokemonEncounterPress,
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

  // No renderizar nada si no es visible
  if (!isVisible) {
    return null;
  }

  return (
    // Usa Portal de Gorhom
    <Portal hostName={MODAL_PORTAL_HOST}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name='close-circle' size={30} color='#555' />
          </TouchableOpacity>
          <WalkSummary
            walkSummary={walkSummary}
            onPokemonEncounterPress={onPokemonEncounterPress}
          />
        </View>
      </View>
    </Portal>
  );
};

// --- Estilos ajustados para el modal falso ---
const styles = StyleSheet.create({
  modalOverlay: {
    // Ocupa toda la pantalla absolutamente
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end', // Alinea el contenido abajo
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 2, // Asegura estar encima
  },
  modalContainer: {
    backgroundColor: 'white',
    height: height * 0.75, // 75% de la altura
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 40, // Deja espacio para el botón de cerrar
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    // El componente WalkSummary debe manejar su propio scroll si es necesario
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 15,
    zIndex: 1, // Asegura que esté sobre el contenido de WalkSummary si hay header
  },
});
