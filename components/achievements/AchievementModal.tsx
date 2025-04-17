import React, { useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  // Quitado TouchableOpacity
  Pressable, // <-- Añadido Pressable
  BackHandler,
  ActivityIndicator,
} from 'react-native';
import { Portal } from '@gorhom/portal';
import Ionicons from '@expo/vector-icons/Ionicons';
import { ACHIEVEMENTS } from '@/src/config/achievements.config'; // Ajusta ruta
import { AchievementDefinition } from '@/src/types/Achievement'; // Ajusta ruta
import { usePlayer } from '@/src/contexts/PlayerContext'; // Ajusta ruta
import { AchievementItem } from './AchievementItem'; // Ajusta ruta
import { MODAL_PORTAL_HOST } from '@/app/_layout'; // Ajusta ruta

interface Props {
  isVisible: boolean;
  onClose: () => void;
}

export const AchievementModal: React.FC<Props> = ({ isVisible, onClose }) => {
  const { getAchievementProgress, isPlayerLoading } = usePlayer();

  // Manejo del botón Atrás (sin cambios)
  useEffect(() => {
    const backAction = () => {
      if (isVisible) { onClose(); return true; }
      return false;
    };
    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  return (
    <Portal hostName={MODAL_PORTAL_HOST}>
      {/* Usar Pressable para el overlay si quieres cerrar al tocar fuera */}
      <View style={styles.modalOverlay}>
          {/* Contenedor del contenido. Usa Pressable para evitar que el toque se propague */}
          {/* O puedes usar un View normal si el overlay no cierra al tocar */}
          <View style={styles.modalContainer}>
              {/* Botón de Cerrar (Ahora con Pressable) */}
              <Pressable
                style={({ pressed }) => [
                    styles.closeButton,
                    pressed && styles.closeButtonPressed // Estilo opcional al presionar
                ]}
                onPress={onClose}
                hitSlop={10} // Área de toque más grande
              >
                <Ionicons name='close-circle' size={32} color='#666' />
              </Pressable>

              {/* Título (sin cambios) */}
              <Text style={styles.modalTitle}>Logros</Text>

              {/* Contenedor de la lista (importante para flex) */}
              
                  {isPlayerLoading ? (
                      <ActivityIndicator size="large" color="#FFCC00" style={styles.loadingIndicator}/>
                  ) : (
                      <FlatList
                          data={ACHIEVEMENTS}
                          renderItem={({ item }: { item: AchievementDefinition }) => (
                              <AchievementItem
                                  achievement={item}
                                  progressData={getAchievementProgress(item.id)}
                              />
                          )}
                          keyExtractor={(item) => item.id}
                          contentContainerStyle={styles.listContainer}
                          showsVerticalScrollIndicator={false}
                          // Quita width: '100%' del listContainer si lo tenías, deja que el wrapper lo controle
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
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    zIndex: 1,
  },
  modalContainer: {
    width: '90%',
    maxHeight: '85%', // Altura máxima del modal
    backgroundColor: '#f0f0f0',
    borderRadius: 15,
    // paddingTop ahora solo es para el espacio del título si no está absoluto
    // paddingBottom es importante si no usas flex: 1 en listWrapper
    // Vamos a usar flexbox para distribuir el espacio
    overflow: 'hidden', // Escondre contenido que se desborde
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 10,
    // Añadir flex para distribuir espacio interno
    display: 'flex',
    flexDirection: 'column',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center', // Asegurar centrado
    paddingVertical: 15, // Espacio vertical para el título
    // Quita position: absolute si usas flexbox para el layout
    // position: 'absolute',
    // top: 15,
    // alignSelf: 'center',
    borderBottomWidth: 1, // Línea separadora opcional bajo el título
    borderBottomColor: '#ddd',
    width: '100%', // Ocupa todo el ancho
  },
  closeButton: {
    position: 'absolute', // Mantenlo absoluto para esquina superior derecha
    top: 10,
    right: 10,
    zIndex: 1, // Encima del título y lista
    padding: 5, // Padding para área de toque
  },
  closeButtonPressed: {
      opacity: 0.6, // Efecto visual al presionar
  },
  // --- Contenedor para la FlatList ---
  listWrapper: {
    flex: 1, // <-- CLAVE: Hace que este View ocupe el espacio vertical restante
    width: '100%', // Asegura que ocupe el ancho
    marginTop: 5, // Pequeño margen sobre la lista
  },
  loadingIndicator: {
      marginTop: 50, // Centrar indicador si está cargando
  },
  listContainer: {
      // paddingHorizontal: 10, // Padding horizontal si quieres espacio a los lados de los items
      paddingBottom: 20, // Espacio al final de la lista
      // Quita width: '100%' de aquí
  },
});