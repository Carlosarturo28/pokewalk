// src/components/walk/WalkSummaryModal.tsx
import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
// Usar alias e importar WalkSummary desde types
import { WalkSummary as WalkSummaryType, PokemonEncounter } from '@/src/types';
import { WalkSummary } from './WalkSummary'; // Importa el componente de lista

interface Props {
  isVisible: boolean;
  onClose: () => void;
  walkSummary: WalkSummaryType | null; // Usa el tipo importado
  onPokemonEncounterPress: (encounter: PokemonEncounter) => void;
}

const { height } = Dimensions.get('window');

export const WalkSummaryModal: React.FC<Props> = ({
  isVisible,
  onClose,
  walkSummary,
  onPokemonEncounterPress,
}) => {
  return (
    <Modal
      animationType='slide'
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name='close-circle' size={30} color='#555' />
          </TouchableOpacity>
          {/* Pasa el tipo WalkSummaryType importado */}
          <WalkSummary
            walkSummary={walkSummary}
            onPokemonEncounterPress={onPokemonEncounterPress}
          />
        </View>
      </View>
    </Modal>
  );
};

// --- Estilos (sin cambios) ---
const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    backgroundColor: 'white',
    height: height * 0.75,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  closeButton: { position: 'absolute', top: 10, right: 15, zIndex: 1 },
});
