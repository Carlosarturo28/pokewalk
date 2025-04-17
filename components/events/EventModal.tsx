import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Pressable,
  ScrollView,
  BackHandler,
} from 'react-native';
import { Portal } from '@gorhom/portal';
import Ionicons from '@expo/vector-icons/Ionicons';
import { EventConfig } from '@/src/services/remoteConfigService'; // Ajusta ruta
import { MODAL_PORTAL_HOST, NOTIFICATION_PORTAL_HOST } from '@/app/_layout'; // Ajusta ruta

interface Props {
  isVisible: boolean;
  onClose: () => void;
  eventData: EventConfig | null; // Recibe la data del evento activo
}

const placeholderEventImage = require('../../assets/images/events/event-placeholder.jpeg'); // Crea un placeholder

export const EventModal: React.FC<Props> = ({ isVisible, onClose, eventData }) => {
  useEffect(() => {
    const backAction = () => { if (isVisible) { onClose(); return true; } return false; };
    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, [isVisible, onClose]);

  if (!isVisible || !eventData || !eventData.isEventRunning) return null; // No mostrar si no hay evento activo

  const imageSource = eventData.imageUrl ? { uri: eventData.imageUrl } : placeholderEventImage;

  return (
    <Portal hostName={NOTIFICATION_PORTAL_HOST}>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
          <View style={styles.modalContainer}>
              <Pressable style={styles.closeButton} onPress={onClose} hitSlop={10}>
                  <Ionicons name='close-circle' size={32} color='#fff' />
              </Pressable>

              <ScrollView contentContainerStyle={styles.scrollContent}>
                  <Image source={imageSource} style={styles.eventImage} resizeMode="cover" />
                  <Text style={styles.modalTitle}>{eventData.title}</Text>
                  <Text style={styles.descriptionText}>{eventData.description}</Text>
              </ScrollView>
              </View>
          </Pressable>
      
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
    width: '90%', // Ancho del modal
    maxWidth: 450, // Ancho máximo
    maxHeight: '85%', // Altura máxima
    backgroundColor: '#fff', // Fondo para el área de texto
    borderRadius: 15, // Bordes redondeados generales
    // Quitar paddingTop y paddingBottom general
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 10,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
},
eventImage: {
    width: '100%', // Ocupa todo el ancho del contenedor
    height: 180, // Altura fija para la imagen (ajusta según necesites)
    // Bordes redondeados SOLO en la parte superior
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
    marginBottom: 20,
},
   scrollContent: { // Estilo para el contenido dentro del ScrollView
        alignItems: 'center', // Centra contenido horizontalmente
        paddingBottom: 20, // Espacio al final
    },
  closeButton: { position: 'absolute', top: 10, right: 10, zIndex: 1, padding: 5, },
  modalTitle: { paddingHorizontal: 20, fontSize: 22, fontWeight: 'bold', color: '#333', textAlign: 'center', marginBottom: 10 },
  descriptionText: { paddingHorizontal: 20, fontSize: 16, color: '#555', textAlign: 'center' },
  // boostsTitle: { fontSize: 16, fontWeight: 'bold', marginTop: 15, marginBottom: 5 },
});