// app/(tabs)/index.tsx
import React, { useState, useEffect, useRef } from 'react'; // Importar useRef
import {
  View,
  StyleSheet,
  Text,
  Image,
  ActivityIndicator,
  TouchableOpacity, // Mantener para el botón de resumen
  Pressable,
  Animated, // <-- Importar Animated
  Easing, // <-- Importar Easing
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// --- Component Imports (Verifica tus alias) ---
import { MapViewComponent } from '@/components/map/MapViewComponent'; // Ajusta ruta
import { WalkControls } from '@/components/walk/WalkControls'; // Ajusta ruta
import { CaptureModal } from '@/components/common/CaptureModal'; // Ajusta ruta
import { WalkSummaryModal } from '@/components/walk/WalkSummaryModal'; // Ajusta ruta
import { useWalk } from '@/src/contexts/WalkContext'; // Ajusta ruta
import { usePlayer } from '@/src/contexts/PlayerContext'; // Ajusta ruta
import { PokemonEncounter } from '@/src/types'; // Ajusta ruta
import { getProfilePictureSourceById } from '@/src/utils/profilePictures'; // Ajusta ruta
import { useEventChecker } from '@/src/hooks/useEventChecker'; // Ajusta ruta
import { EventModal } from '@/components/events/EventModal'; // Ajusta ruta

// --- Assets ---
const profilePlaceholder = require('../../assets/images/profile-placeholder.png'); // Ajusta ruta
const eventIconPlaceholder = require('../../assets/images/events/placeholder-badge.png'); // Ajusta ruta

// --- MiniXPBar Component (Sin cambios) ---
const MiniXPBar: React.FC<{ currentXP: number; xpToNextLevel: number }> = ({
  currentXP,
  xpToNextLevel,
}) => {
  const p = xpToNextLevel > 0 ? Math.min(1, currentXP / xpToNextLevel) : currentXP > 0 ? 1 : 0;
  return (
    <View style={styles.miniXpBarContainer}>
      <View style={[styles.miniXpBarFilled, { width: `${p * 100}%` }]} />
    </View>
  );
};

// --- CaminataScreen Component ---
export default function CaminataScreen() {
  // --- Hooks de Estado y Contexto ---
  const { isWalking, walkSummary, isProcessingWalk, showSummaryModalSignal, markEncounterAsCaught, removeEncounterFromSummary } = useWalk();
  const { playerStats, isPlayerLoading } = usePlayer();
  const { shouldShowEventModal, currentEventData, markEventAsSeen, isLoadingCheck } = useEventChecker();

  const [selectedEncounter, setSelectedEncounter] = useState<PokemonEncounter | null>(null);
  const [isCaptureModalVisible, setIsCaptureModalVisible] = useState(false);
  const [isSummaryModalVisible, setIsSummaryModalVisible] = useState(false);
  const [isManualEventModalVisible, setIsManualEventModalVisible] = useState(false);

  // --- Lógica de Modales ---
  const handlePokemonEncounterPress = (encounter: PokemonEncounter) => {
    if (encounter.caught) return;
    setSelectedEncounter(encounter);
    setIsCaptureModalVisible(true);
  };
  const handleCloseCaptureModal = () => {
    setIsCaptureModalVisible(false);
    setSelectedEncounter(null);
  };
  const handleCloseEventModal = () => {
    setIsManualEventModalVisible(false);
    markEventAsSeen();
  };
  const handleOpenEventModal = () => {
    if (currentEventData) { setIsManualEventModalVisible(true); }
  };

  // Efecto para mostrar modal de evento automáticamente
  useEffect(() => {
    if (shouldShowEventModal) { setIsManualEventModalVisible(true); }
  }, [shouldShowEventModal]);

  // Efecto para mostrar modal de resumen
  useEffect(() => {
    if (showSummaryModalSignal > 0 && !isWalking && !isProcessingWalk && walkSummary) {
      setIsSummaryModalVisible(true);
    }
  }, [showSummaryModalSignal, isWalking, isProcessingWalk, walkSummary]);


  // --- Animación para el Indicador de Evento (con Animated API) ---
  const translateYAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (currentEventData && !isLoadingCheck) {
      const floatAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(translateYAnim, { toValue: 4, duration: 1800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(translateYAnim, { toValue: -4, duration: 1800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(translateYAnim, { toValue: 0, duration: 1800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ])
      );
      floatAnimation.start();
      return () => floatAnimation.stop(); // Detiene al desmontar o cambiar evento/carga
    } else {
      translateYAnim.stopAnimation(); // Asegura detener si no hay evento
      translateYAnim.setValue(0); // Resetea posición
    }
  }, [currentEventData, isLoadingCheck, translateYAnim]);
  // --- Fin Animación ---


  // Obtener imagen de perfil
  const profilePicSource = getProfilePictureSourceById(playerStats.profilePictureUri) || profilePlaceholder; // Usa placeholder si no hay selección

  // --- Función para renderizar el contenido principal ---
  const renderMainContent = () => {
    // Estados: Walking, Processing, Map/Summary Available, Idle
    if (isWalking) {
      return (
        <View style={styles.placeholderContainer}>
          <Image source={require('../../assets/images/walkinprogress.png')} style={styles.idleImage} />
          <Text style={styles.placeholderTitle}>¡Aventura en Progreso!</Text>
          <Text style={styles.placeholderText}>Registrando tu ubicación...</Text>
          <Text style={styles.placeholderSubText}>(Puedes guardar tu celular)</Text>
        </View>
      );
    }
    if (isProcessingWalk) {
      return (
        <View style={styles.placeholderContainer}>
          <ActivityIndicator size='large' color='#FFCC00' style={styles.activityIndicator} />
          <Text style={styles.placeholderTitle}>Procesando recorrido</Text>
          <Text style={styles.placeholderText}>Generando encuentros Pokémon...</Text>
        </View>
      );
    }
    // Mostrar mapa si hay resumen (implica que terminó y procesó)
    if (walkSummary && !isWalking && !isProcessingWalk) {
      return (
        <View style={styles.mapContainerActual}>
          <MapViewComponent onEncounterPress={handlePokemonEncounterPress} />
        </View>
      );
    }
    // Estado Idle inicial o después de cerrar resumen sin caminar de nuevo
    return (
      <View style={styles.placeholderContainer}>
        <Image source={require('../../assets/images/startwalk.png')} style={styles.idleImage} />
        <Text style={styles.placeholderTitle}>Listo para Explorar</Text>
        <Text style={styles.placeholderText}>Presiona "Iniciar Aventura" para comenzar.</Text>
      </View>
    );
  };


  // --- Renderizado del Componente Principal ---
  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Barra de Info del Jugador */}
      <View style={styles.playerInfoBar}>
        {isPlayerLoading ? (
          <ActivityIndicator color='#fff' size='small' />
        ) : (
          <>
            <Image source={profilePicSource} style={styles.playerInfoPic} />
            <View style={styles.playerInfoTextContainer}>
              <Text style={styles.playerNameText} numberOfLines={1}>{playerStats.playerName}</Text>
              <Text style={styles.playerLevelText}>Nivel {playerStats.level}</Text>
              <MiniXPBar currentXP={playerStats.currentXP} xpToNextLevel={playerStats.xpToNextLevel} />
            </View>
            {/* Botón "Ver Resumen" */}
            {walkSummary && !isWalking && !isProcessingWalk && (
              <TouchableOpacity style={styles.summaryButton} onPress={() => setIsSummaryModalVisible(true)} >
                <Text style={styles.summaryButtonText}>Ver Resumen</Text>
              </TouchableOpacity>
            )}
          </>
        )}
      </View>

      {/* Indicador de Evento (Animado) */}
      {currentEventData && !isLoadingCheck && (
          <Animated.View style={[styles.eventIndicator, { transform: [{ translateY: translateYAnim }] } ]}>
              <Pressable onPress={handleOpenEventModal} style={styles.pressableArea}>
                  <Image
                      source={currentEventData.badgeUrl ? {uri: currentEventData.badgeUrl} : eventIconPlaceholder}
                      style={styles.eventIndicatorIcon}
                      resizeMode='cover' // Asegura que llene el círculo
                  />
              </Pressable>
          </Animated.View>
      )}

      {/* Contenido Principal */}
      <View style={styles.mainContentArea}>{renderMainContent()}</View>

      {/* Controles */}
      <View style={styles.controlsContainer}>
        <WalkControls />
      </View>

      {/* Modales */}
      {selectedEncounter && ( // Renderizar solo si hay encounter seleccionado
        <CaptureModal
            visible={isCaptureModalVisible}
            encounter={selectedEncounter}
            onClose={handleCloseCaptureModal}
        />
      )}
      <EventModal
          isVisible={isManualEventModalVisible}
          onClose={handleCloseEventModal}
          eventData={currentEventData}
      />
      <WalkSummaryModal
        isVisible={isSummaryModalVisible}
        onClose={() => setIsSummaryModalVisible(false)}
        walkSummary={walkSummary}
        onPokemonEncounterPress={handlePokemonEncounterPress}
      />
       {/* Añade aquí tu ProfilePictureSelectorModal si existe */}
       {/* <ProfilePictureSelectorModal ... /> */}

    </SafeAreaView>
  );
}

// --- Estilos (Copia los estilos completos de la respuesta anterior) ---
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f4f4' },
  playerInfoBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.75)', paddingHorizontal: 10, paddingVertical: 5, height: 60, zIndex: 10 },
  playerInfoPic: { width: 45, height: 45, borderRadius: 22.5, borderWidth: 1, borderColor: '#fff', marginRight: 10, backgroundColor: '#555' },
  playerInfoTextContainer: { flex: 1, justifyContent: 'center' },
  playerNameText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  playerLevelText: { color: '#ddd', fontSize: 13 },
  miniXpBarContainer: { height: 6, backgroundColor: 'rgba(255, 255, 255, 0.3)', borderRadius: 3, marginTop: 3, width: '100%' },
  miniXpBarFilled: { height: '100%', backgroundColor: '#81d4fa', borderRadius: 3 },
  summaryButton: { marginLeft: 10, paddingHorizontal: 12, paddingVertical: 6, backgroundColor: '#FFCC00', borderRadius: 15 },
  summaryButtonText: { color: '#333', fontWeight: 'bold', fontSize: 13 },
  mainContentArea: { flex: 1 },
  mapContainerActual: { flex: 1 },
  placeholderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30, backgroundColor: '#ECEFF1' },
  idleImage: { width: 300, height: 300, marginBottom: 30, opacity: 1 },
  activityIndicator: { marginBottom: 20 },
  placeholderTitle: { fontSize: 22, fontWeight: 'bold', color: '#37474F', textAlign: 'center', marginBottom: 10 },
  placeholderText: { fontSize: 16, color: '#546E7A', textAlign: 'center', marginBottom: 8 },
  placeholderSubText: { fontSize: 14, color: '#78909C', textAlign: 'center' },
  controlsContainer: { position: 'absolute', bottom: 15, left: 15, right: 15, zIndex: 10 },
  // --- Estilos del Indicador de Evento ---
  eventIndicator: {
    position: 'absolute',
    top: 80, // Ajusta según necesites
    right: 15,
    zIndex: 50, // Encima del mapa, debajo de modales
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  pressableArea: { // Ocupa todo el Animated.View
     width: '100%',
     height: '100%',
     justifyContent: 'center',
     alignItems: 'center',
     borderRadius: 25,
     overflow: 'hidden', // Importante para que la imagen respete el borde
  },
  eventIndicatorIcon: {
      width: '100%',
      height: '100%',
      // No necesita borderRadius si pressableArea tiene overflow: hidden
  },
});