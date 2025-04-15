// src/contexts/NotificationContext.tsx
import React, {
  createContext,
  useState,
  useContext,
  useRef,
  useCallback,
  ReactNode,
  useEffect,
} from 'react';
import {
  NotificationConfig,
  NotificationState,
  NotificationType,
} from '../types/Notification';

interface NotificationContextProps {
  showNotification: (config: Omit<NotificationConfig, 'id'>) => void; // No requiere ID externo
  // Estado actual (opcional exponerlo si otro componente lo necesita)
  // currentNotification: NotificationState | null;
}

const NotificationContext = createContext<NotificationContextProps | undefined>(
  undefined
);

const DEFAULT_DURATION = 3500; // ms

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [currentNotification, setCurrentNotification] =
    useState<NotificationState | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const hideNotification = useCallback(() => {
    setCurrentNotification((prev) =>
      prev ? { ...prev, isVisible: false } : null
    );
    // Podríamos añadir un pequeño delay aquí antes de ponerlo a null si queremos animación de salida
    // setTimeout(() => setCurrentNotification(null), 500); // Ejemplo delay
  }, []);

  const showNotification = useCallback(
    (config: Omit<NotificationConfig, 'id'>) => {
      // Limpia el timeout anterior si existiera
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      const newNotification: NotificationState = {
        ...config,
        id: `notif-${Date.now()}-${Math.random()}`, // Genera ID único
        isVisible: true,
      };

      setCurrentNotification(newNotification);

      // Establece el timeout para ocultar automáticamente
      const duration = config.duration ?? DEFAULT_DURATION;
      timeoutRef.current = setTimeout(() => {
        hideNotification();
      }, duration);
    },
    [hideNotification]
  );

  // Limpia el timeout si el provider se desmonta
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Nota: No estamos exponiendo `currentNotification` directamente en el valor
  // del contexto porque solo el componente `NotificationDisplay` lo necesita.
  // Si otros componentes necesitaran reaccionar al estado, lo añadiríamos aquí.
  const value = { showNotification };

  return (
    <NotificationContext.Provider value={value}>
      {children}
      {/* El componente que muestra la notificación se renderiza aquí */}
      <NotificationDisplay notification={currentNotification} />
    </NotificationContext.Provider>
  );
};

// Hook para usar el contexto
export const useNotification = (): NotificationContextProps => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      'useNotification must be used within a NotificationProvider'
    );
  }
  return context;
};

// --- Componente Interno para Mostrar la Notificación ---
// (Lo ponemos aquí para mantenerlo encapsulado, o puede ir en /components)

import {
  View,
  Text,
  Image,
  StyleSheet,
  Modal,
  TouchableWithoutFeedback,
} from 'react-native';
import * as Animatable from 'react-native-animatable'; // Necesitarás instalarla: npm i react-native-animatable

// Mapeo de tipos a colores/iconos (similar a CustomToast)
const notificationStyles = {
  success: { backgroundColor: '#DCEDC8', borderColor: '#7CB342' }, // Verde más claro
  error: { backgroundColor: '#FFCDD2', borderColor: '#E57373' }, // Rojo más claro
  info: { backgroundColor: '#BBDEFB', borderColor: '#64B5F6' }, // Azul más claro
  warning: { backgroundColor: '#FFF9C4', borderColor: '#FFD54F' }, // Amarillo
};

const NotificationDisplay: React.FC<{
  notification: NotificationState | null;
}> = ({ notification }) => {
  const [internalVisible, setInternalVisible] = useState(false);
  const viewRef = useRef<Animatable.View & View>(null); // Ref para animaciones

  useEffect(() => {
    if (notification?.isVisible) {
      setInternalVisible(true); // Muestra inmediatamente al recibir notificación
    } else if (internalVisible && viewRef.current) {
      // Si estaba visible pero la notificación ya no (timeout), ejecuta animación de salida
      viewRef.current
        .animate('fadeOutDown', 500) // O 'fadeOutUp', 'zoomOut', etc.
        .then(() => setInternalVisible(false)); // Oculta *después* de la animación
    } else {
      // Si no hay notificación o ya se ocultó internamente
      setInternalVisible(false);
    }
  }, [notification?.isVisible, internalVisible]); // Depende de la visibilidad del contexto

  if (!internalVisible || !notification) {
    return null; // No renderizar nada si no está visible
  }

  const stylesForType =
    notificationStyles[notification.type] || notificationStyles.info;

  // Animación de entrada diferente según el tipo? O una estándar.
  const entryAnimation = 'bounceInUp'; // Ej: 'fadeInUp', 'zoomIn', 'bounceIn'

  return (
    // Usamos un Modal transparente para superponer sobre todo
    <Modal
      transparent={true}
      visible={internalVisible} // Controlado por estado interno para animación de salida
      animationType='none' // Las animaciones las maneja Animatable
      onRequestClose={() => {
        /* Podríamos permitir cerrar con botón atrás? */
      }}
    >
      {/* Fondo semi-transparente opcional */}
      {/* <View style={styles.modalBackground} /> */}

      {/* Usamos TouchableWithoutFeedback para detectar toques fuera (y no hacer nada) */}
      <TouchableWithoutFeedback
        onPress={() => {
          /* No cerrar al tocar fuera */
        }}
      >
        <View style={styles.modalCenteredView} pointerEvents='box-none'>
          {/* Vista animada */}
          <Animatable.View
            ref={viewRef}
            animation={entryAnimation}
            duration={600}
            style={[styles.notificationContainer, stylesForType]}
            pointerEvents='auto' // Permite tocar la notificación si tuviera botones
          >
            {/* Imagen */}
            {notification.imageSource && (
              <View style={styles.imageContainer}>
                <Image
                  source={notification.imageSource}
                  style={styles.image}
                  resizeMode='contain'
                />
              </View>
            )}
            {/* Textos */}
            <View style={styles.textContainer}>
              <Text style={styles.title}>{notification.title}</Text>
              {notification.message && (
                <Text style={styles.message}>{notification.message}</Text>
              )}
            </View>
          </Animatable.View>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

// --- Estilos para NotificationDisplay ---
const styles = StyleSheet.create({
  modalBackground: {
    // Fondo opcional para oscurecer
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.1)', // Muy sutil
  },
  modalCenteredView: {
    // Contenedor que centra el modal
    flex: 1,
    justifyContent: 'flex-end', // Posiciona abajo
    // justifyContent: 'center', // O centrado
    alignItems: 'center',
    paddingBottom: 50, // Margen inferior
    // paddingHorizontal: 20, // Si está centrado
  },
  notificationContainer: {
    flexDirection: 'row',
    width: '90%', // Ancho del 'modal'
    maxWidth: 400, // Ancho máximo
    padding: 15,
    borderRadius: 12,
    borderWidth: 1.5, // Borde más grueso
    // Estilos base de sombra (iguales que CustomToast)
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 7,
    alignItems: 'center',
  },
  imageContainer: {
    width: 45, // Un poco más grande
    height: 45,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  image: {
    width: 40,
    height: 40,
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 16, // Ligeramente más grande
    fontWeight: 'bold',
    color: '#111', // Casi negro para buen contraste
  },
  message: {
    fontSize: 14, // Ligeramente más grande
    color: '#444', // Gris oscuro
    marginTop: 3,
  },
});
