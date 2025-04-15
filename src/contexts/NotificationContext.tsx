// src/contexts/NotificationContext.tsx
import React, {
  createContext,
  useState,
  useContext,
  useRef,
  useCallback,
  useEffect,
  ReactNode,
} from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  Platform,
  ImageSourcePropType,
  Modal, // <-- Importar Modal de nuevo
  TouchableWithoutFeedback, // <-- Necesario para cerrar al tocar fuera (opcional)
} from 'react-native';
import * as Animatable from 'react-native-animatable';
import {
  NotificationConfig,
  NotificationState,
  NotificationType,
} from '../types/Notification';

// --- Interfaz del Contexto ---
interface NotificationContextProps {
  showNotification: (config: Omit<NotificationConfig, 'id'>) => void;
}

const NotificationContext = createContext<NotificationContextProps | undefined>(
  undefined
);

const DEFAULT_DURATION = 3500;

// --- Provider ---
export const NotificationProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [currentNotification, setCurrentNotification] =
    useState<NotificationState | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Oculta la notificación (cambia isVisible)
  const hideNotification = useCallback(() => {
    setCurrentNotification((prev) =>
      prev ? { ...prev, isVisible: false } : null
    );
  }, []);

  // Muestra una nueva notificación
  const showNotification = useCallback(
    (config: Omit<NotificationConfig, 'id'>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      const newNotification: NotificationState = {
        ...config,
        id: `notif-${Date.now()}-${Math.random()}`,
        isVisible: true, // Marcar como visible para que NotificationDisplay reaccione
      };

      setCurrentNotification(newNotification);

      // Programa el ocultamiento automático
      const duration = config.duration ?? DEFAULT_DURATION;
      timeoutRef.current = setTimeout(() => {
        hideNotification();
      }, duration);
    },
    [hideNotification]
  );

  // Limpia timeout al desmontar
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const value = { showNotification };

  return (
    <NotificationContext.Provider value={value}>
      {children}
      {/* Renderiza el componente de display aquí */}
      <NotificationDisplay notification={currentNotification} />
    </NotificationContext.Provider>
  );
};

// --- Hook ---
export const useNotification = (): NotificationContextProps => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      'useNotification must be used within a NotificationProvider'
    );
  }
  return context;
};

// --- Componente NotificationDisplay (AHORA CON MODAL) ---

const notificationStyles = {
  success: { backgroundColor: '#DCEDC8', borderColor: '#7CB342' },
  error: { backgroundColor: '#FFCDD2', borderColor: '#E57373' },
  info: { backgroundColor: '#BBDEFB', borderColor: '#64B5F6' },
  warning: { backgroundColor: '#FFF9C4', borderColor: '#FFD54F' },
};

const NotificationDisplay: React.FC<{
  notification: NotificationState | null;
}> = ({ notification }) => {
  const [internalVisible, setInternalVisible] = useState(false);
  const viewRef = useRef<Animatable.View & View>(null);

  useEffect(() => {
    // Si la notificación del contexto debe ser visible...
    if (notification?.isVisible) {
      // Si no está visible internamente, hazla visible (esto abre el Modal)
      if (!internalVisible) {
        setInternalVisible(true);
      }
    }
    // Si la notificación del contexto NO debe ser visible, pero internamente SÍ lo está...
    else if (internalVisible && viewRef.current) {
      // Ejecuta animación de salida ANTES de cerrar el Modal
      viewRef.current
        .animate('fadeOutDown', 300) // Animación más rápida
        .then(() => setInternalVisible(false)); // Cierra el Modal después
    }
    // Asegurar que esté cerrado si no hay notificación
    else if (!notification && internalVisible) {
      setInternalVisible(false);
    }
  }, [notification, internalVisible]); // Reacciona a cambios en la notificación del contexto

  // La visibilidad del MODAL ahora depende de internalVisible
  if (!notification && !internalVisible) {
    // No renderizar si no hay notif y ya se ocultó
    return null;
  }

  // Solo necesitamos los datos de la notificación si vamos a renderizar el modal
  const currentNotifData = notification ?? ({} as Partial<NotificationState>); // Usa datos actuales o vacío
  const stylesForType =
    notificationStyles[currentNotifData.type ?? 'info'] ||
    notificationStyles.info;
  const entryAnimation = 'fadeInUp';

  return (
    // --- USA EL MODAL DE REACT NATIVE ---
    <Modal
      transparent={true}
      visible={internalVisible} // Controlado por estado interno
      animationType='none' // Deshabilita animación nativa del modal
      onRequestClose={() => {
        // Podríamos forzar el cierre aquí si el usuario presiona atrás en Android
        // setCurrentNotification(prev => prev ? { ...prev, isVisible: false } : null);
        // setInternalVisible(false);
      }}
    >
      {/* Contenedor que permite centrar y no bloquea toques fuera de la notificación en sí */}
      <View style={styles.modalOuterContainer} pointerEvents='box-none'>
        {/* Contenedor interno para posicionar (abajo en este caso) */}
        <View style={styles.modalPositioner} pointerEvents='box-none'>
          {/* Vista Animable con el contenido */}
          <Animatable.View
            ref={viewRef}
            // Solo ejecuta animación de entrada si acabamos de volvernos visibles
            animation={
              internalVisible && notification?.isVisible
                ? entryAnimation
                : undefined
            }
            duration={500}
            style={[styles.notificationContainer, stylesForType]}
            pointerEvents='auto' // La notificación SÍ es interactuable
          >
            {/* Imagen */}
            {currentNotifData.imageSource && (
              <View style={styles.imageContainer}>
                <Image
                  source={currentNotifData.imageSource}
                  style={styles.image}
                  resizeMode='contain'
                />
              </View>
            )}
            {/* Textos */}
            <View style={styles.textContainer}>
              <Text style={styles.title}>{currentNotifData.title ?? ''}</Text>
              {currentNotifData.message && (
                <Text style={styles.message}>{currentNotifData.message}</Text>
              )}
            </View>
          </Animatable.View>
        </View>
      </View>
    </Modal>
  );
};

// --- Estilos para NotificationDisplay ---
const styles = StyleSheet.create({
  // Contenedor externo del Modal, ocupa todo y permite pasar toques
  modalOuterContainer: {
    flex: 1,
    // backgroundColor: 'rgba(0, 0, 0, 0.1)', // Fondo opcional si quieres oscurecer un poco
  },
  // Contenedor interno para posicionar la notificación (abajo y centrada)
  modalPositioner: {
    flex: 1, // Ocupa espacio disponible
    justifyContent: 'flex-end', // Alinea abajo
    alignItems: 'center', // Centra horizontalmente
    // Espaciado desde el borde inferior (considera altura de tab bar)
    paddingBottom: Platform.select({
      ios: 80,
      android: 60,
    }),
    paddingHorizontal: 10, // Padding horizontal para que no pegue a los bordes
  },
  // Estilos de la tarjeta de notificación visible
  notificationContainer: {
    flexDirection: 'row',
    width: '100%', // Ocupa el ancho disponible dentro del positioner (con padding)
    maxWidth: 450,
    padding: 15,
    borderRadius: 12,
    borderWidth: 1.5,
    backgroundColor: 'white', // Fondo blanco por defecto (sobrescrito por tipo)
    // Sombra
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 7,
    alignItems: 'center',
  },
  imageContainer: {
    width: 45,
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
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111',
  },
  message: {
    fontSize: 14,
    color: '#444',
    marginTop: 3,
  },
});
