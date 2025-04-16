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
import { View, Text, Image, StyleSheet, Platform } from 'react-native';
import * as Animatable from 'react-native-animatable';
// Importa Portal de @gorhom/portal
import { Portal } from '@gorhom/portal';
import {
  NotificationConfig,
  NotificationState,
  NotificationType,
} from '../types/Notification'; // <-- VERIFICA ESTA RUTA
import { NOTIFICATION_PORTAL_HOST } from '@/app/_layout';
// Importa el nombre del host definido en App.tsx

// --- Interfaz del Contexto ---
interface NotificationContextProps {
  showNotification: (config: Omit<NotificationConfig, 'id'>) => void;
}

const NotificationContext = createContext<NotificationContextProps | undefined>(
  undefined
);

const DEFAULT_DURATION = 3500; // Duración predeterminada en milisegundos

// --- Provider ---
export const NotificationProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [currentNotification, setCurrentNotification] =
    useState<NotificationState | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Lógica para ocultar (marca como no visible)
  const hideNotification = useCallback(() => {
    setCurrentNotification((prev) =>
      prev ? { ...prev, isVisible: false } : null
    );
  }, []);

  // Muestra una nueva notificación
  const showNotification = useCallback(
    (config: Omit<NotificationConfig, 'id'>) => {
      // Limpia timeout anterior si existía
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      // Oculta la notificación actual si está visible (transición rápida)
      setCurrentNotification((prev) =>
        prev && prev.isVisible ? { ...prev, isVisible: false } : null
      );

      // Pequeño delay para mostrar la nueva
      setTimeout(() => {
        const newNotification: NotificationState = {
          ...config,
          id: `notif-${Date.now()}-${Math.random()}`, // ID único
          isVisible: true, // Marcar como visible para mostrar
        };
        setCurrentNotification(newNotification);

        // Programa el ocultamiento automático
        const duration = config.duration ?? DEFAULT_DURATION;
        timeoutRef.current = setTimeout(() => {
          hideNotification();
        }, duration);
      }, 50); // Delay corto (ajustar si es necesario)
    },
    [hideNotification]
  );

  // Limpia timeout al desmontar el provider
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Valor que provee el contexto
  const value = { showNotification };

  return (
    <NotificationContext.Provider value={value}>
      {children}
      {/* Renderiza el componente de display DENTRO de un Portal de Gorhom */}
      {/* Solo renderiza el Portal si hay una notificación en el estado */}
      {currentNotification && (
        <Portal hostName={NOTIFICATION_PORTAL_HOST}>
          <NotificationDisplay
            key={currentNotification.id} // Key para asegurar re-render y animación
            notification={currentNotification}
            onHideComplete={() => {
              // Opcional: Podrías limpiar la notificación aquí si fuera necesario
              // setCurrentNotification(null);
            }}
          />
        </Portal>
      )}
    </NotificationContext.Provider>
  );
};

// --- Hook para usar el contexto ---
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

// Estilos predefinidos por tipo de notificación
const notificationStyles: Record<
  NotificationType,
  { backgroundColor: string; borderColor: string }
> = {
  success: { backgroundColor: '#DCEDC8', borderColor: '#7CB342' },
  error: { backgroundColor: '#FFCDD2', borderColor: '#E57373' },
  info: { backgroundColor: '#BBDEFB', borderColor: '#64B5F6' },
  warning: { backgroundColor: '#FFF9C4', borderColor: '#FFD54F' },
};

// Props para el componente de display
interface NotificationDisplayProps {
  notification: NotificationState;
  onHideComplete?: () => void;
}

// Componente que renderiza la UI de la notificación
const NotificationDisplay: React.FC<NotificationDisplayProps> = ({
  notification,
  onHideComplete,
}) => {
  // Estado interno para controlar la visibilidad y animación de salida
  const [isVisibleInternal, setIsVisibleInternal] = useState(true);
  const viewRef = useRef<Animatable.View & View>(null); // Ref para la vista animable

  useEffect(() => {
    // Si la notificación del contexto ya no debe ser visible,
    // pero nuestro estado interno aún dice que sí, iniciamos la animación de salida.
    if (!notification.isVisible && isVisibleInternal && viewRef.current) {
      viewRef.current
        .animate('fadeOutDown', 300) // Animación de salida
        .then(() => {
          setIsVisibleInternal(false); // Actualiza estado interno al terminar
          onHideComplete?.(); // Llama al callback opcional
        });
    }
    // Asegura que esté visible internamente si la notificación del contexto lo está
    else if (notification.isVisible && !isVisibleInternal) {
      setIsVisibleInternal(true);
    }
  }, [notification.isVisible, isVisibleInternal, onHideComplete]); // Dependencias

  // Si ya no es visible internamente (después de la animación), no renderizar nada
  if (!isVisibleInternal) {
    return null;
  }

  // Determina estilos y animación de entrada
  const stylesForType =
    notificationStyles[notification.type] || notificationStyles.info;
  const entryAnimation = 'fadeInUp'; // Animación de entrada

  return (
    // Contenedor externo para posicionamiento absoluto
    <View style={styles.outerContainer} pointerEvents='box-none'>
      {/* Vista Animable que contiene la notificación */}
      <Animatable.View
        ref={viewRef}
        animation={entryAnimation} // Aplica animación de entrada
        duration={500}
        style={[styles.notificationContainer, stylesForType]}
        pointerEvents='auto' // Permite interacción con la notificación
      >
        {/* Icono/Imagen (si existe) */}
        {notification.imageSource && (
          <View style={styles.imageContainer}>
            <Image
              source={notification.imageSource}
              style={styles.image}
              resizeMode='contain'
            />
          </View>
        )}
        {/* Contenedor de Texto */}
        <View style={styles.textContainer}>
          <Text style={styles.title}>{notification.title ?? ''}</Text>
          {notification.message && (
            <Text style={styles.message}>{notification.message}</Text>
          )}
        </View>
      </Animatable.View>
    </View>
  );
};

// --- Estilos para NotificationDisplay ---
const styles = StyleSheet.create({
  outerContainer: {
    position: 'absolute', // Posicionamiento absoluto para flotar
    // Distancia desde abajo (considera TabBar, etc.)
    bottom: Platform.select({
      ios: 80, // Mayor espacio en iOS por defecto
      android: 60,
    }),
    left: 10, // Margen izquierdo
    right: 10, // Margen derecho
    alignItems: 'center', // Centra la tarjeta horizontalmente
    // zIndex y elevation son menos necesarios con Portal, pero pueden ayudar en casos complejos
    zIndex: 4,
  },
  notificationContainer: {
    flexDirection: 'row', // Layout horizontal (imagen | texto)
    width: '100%', // Ocupa el ancho disponible (limitado por outerContainer y maxWidth)
    maxWidth: 450, // Ancho máximo para pantallas grandes
    padding: 15, // Padding interno
    borderRadius: 12, // Bordes redondeados
    borderWidth: 1.5, // Grosor del borde
    backgroundColor: 'white', // Fondo base
    // Sombra (iOS y Android)
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 7, // Sombra para Android
    alignItems: 'center', // Centra verticalmente el contenido de la fila
  },
  imageContainer: {
    width: 60, // Ancho fijo para el contenedor de imagen
    height: 60, // Alto fijo
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15, // Espacio entre imagen y texto
  },
  image: {
    width: 60, // Tamaño de la imagen
    height: 60,
  },
  textContainer: {
    flex: 1, // Ocupa el espacio restante
    justifyContent: 'center', // Centra el texto verticalmente
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111', // Color oscuro para el título
  },
  message: {
    fontSize: 14,
    color: '#444', // Color grisáceo para el mensaje
    marginTop: 3, // Pequeño espacio sobre el mensaje
  },
});
