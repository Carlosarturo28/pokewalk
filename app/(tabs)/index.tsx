// app/(tabs)/index.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Text,
  Image,
  ActivityIndicator,
  TouchableOpacity, // Ya estaba
  // Button ya no es necesario importar aquí directamente
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// --- Component Imports (Verifica tus alias) ---
import { MapViewComponent } from '@/components/map/MapViewComponent';
import { WalkControls } from '@/components/walk/WalkControls';
import { CaptureModal } from '@/components/common/CaptureModal';
import { WalkSummaryModal } from '@/components/walk/WalkSummaryModal';
import { useWalk } from '@/src/contexts/WalkContext';
import { usePlayer } from '@/src/contexts/PlayerContext';
import { PokemonEncounter } from '@/src/types';
import { getProfilePictureSourceById } from '@/src/utils/profilePictures';

// --- Assets ---
const profilePlaceholder = require('../../assets/images/profile-placeholder.png'); // Alias

// --- MiniXPBar Component (Sin cambios) ---
const MiniXPBar: React.FC<{ currentXP: number; xpToNextLevel: number }> = ({
  currentXP,
  xpToNextLevel,
}) => {
  const p =
    xpToNextLevel > 0
      ? Math.min(1, currentXP / xpToNextLevel)
      : currentXP > 0
      ? 1
      : 0;
  return (
    <View style={styles.miniXpBarContainer}>
      <View style={[styles.miniXpBarFilled, { width: `${p * 100}%` }]} />
    </View>
  );
};

// --- CaminataScreen Component Refactorizado ---
export default function CaminataScreen() {
  const { isWalking, walkSummary, isProcessingWalk, showSummaryModalSignal } =
    useWalk();
  const { playerStats, isPlayerLoading } = usePlayer();
  const [selectedEncounter, setSelectedEncounter] =
    useState<PokemonEncounter | null>(null);
  const [isCaptureModalVisible, setIsCaptureModalVisible] = useState(false);
  const [isSummaryModalVisible, setIsSummaryModalVisible] = useState(false);

  const handlePokemonEncounterPress = (encounter: PokemonEncounter) => {
    if (encounter.caught) return;
    setSelectedEncounter(encounter);
    setIsCaptureModalVisible(true);
  };

  const handleCloseCaptureModal = () => {
    setIsCaptureModalVisible(false);
    setSelectedEncounter(null);
  };

  // useEffect para abrir modal de resumen (Sin cambios, funciona bien)
  useEffect(() => {
    if (
      showSummaryModalSignal > 0 &&
      !isWalking &&
      !isProcessingWalk &&
      walkSummary
    ) {
      console.log('useEffect triggered: Opening Summary Modal');
      setIsSummaryModalVisible(true);
    }
  }, [showSummaryModalSignal, isWalking, isProcessingWalk, walkSummary]); // Añadidas dependencias extra por claridad

  const profilePicSource = getProfilePictureSourceById(
    playerStats.profilePictureUri
  );

  // --- Función para renderizar el contenido principal (Mapa o Vistas Simples) ---
  const renderMainContent = () => {
    // 1. Fase Walking
    if (isWalking) {
      return (
        <View style={styles.placeholderContainer}>
          <Image
            source={require('../../assets/images/walkinprogress.png')}
            style={styles.idleImage}
          />
          <Text style={styles.placeholderTitle}>¡Caminata en Progreso!</Text>
          <Text style={styles.placeholderText}>
            Registrando tu ubicación...
          </Text>
          <Text style={styles.placeholderSubText}>
            (Puedes guardar tu celular)
          </Text>
        </View>
      );
    }
    // 2. Fase Procesando
    if (isProcessingWalk) {
      return (
        <View style={styles.placeholderContainer}>
          <ActivityIndicator
            size='large'
            color='#FFCC00'
            style={styles.activityIndicator}
          />
          <Text style={styles.placeholderTitle}>Procesando Recorrido</Text>
          <Text style={styles.placeholderText}>
            Generando encuentros Pokémon...
          </Text>
        </View>
      );
    }
    // 3. Fase Mapa/Resumen Disponible (Hay un resumen y no estamos caminando/procesando)
    if (walkSummary && !isWalking && !isProcessingWalk) {
      return (
        <View style={styles.mapContainerActual}>
          <MapViewComponent onEncounterPress={handlePokemonEncounterPress} />
        </View>
      );
    }
    // 4. Fase Idle (No caminando, no procesando, sin resumen aún o sin importar resumen)
    return (
      <View style={styles.placeholderContainer}>
        <Image
          source={require('../../assets/images/startwalk.png')}
          style={styles.idleImage}
        />
        <Text style={styles.placeholderTitle}>Listo para Explorar</Text>
        <Text style={styles.placeholderText}>
          Presiona "Iniciar Caminata" para comenzar.
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Barra de Info del Jugador (Siempre Visible) */}
      <View style={styles.playerInfoBar}>
        {isPlayerLoading ? (
          <ActivityIndicator color='#fff' size='small' />
        ) : (
          <>
            <Image source={profilePicSource} style={styles.playerInfoPic} />
            <View style={styles.playerInfoTextContainer}>
              <Text style={styles.playerNameText} numberOfLines={1}>
                {playerStats.playerName}
              </Text>
              <Text style={styles.playerLevelText}>
                Nivel {playerStats.level}
              </Text>
              <MiniXPBar
                currentXP={playerStats.currentXP}
                xpToNextLevel={playerStats.xpToNextLevel}
              />
            </View>
            {/* Botón "Ver Resumen" solo visible si hay resumen y no estamos caminando/procesando */}
            {walkSummary && !isWalking && !isProcessingWalk && (
              <TouchableOpacity
                style={styles.summaryButton}
                onPress={() => setIsSummaryModalVisible(true)}
              >
                <Text style={styles.summaryButtonText}>Ver Resumen</Text>
              </TouchableOpacity>
            )}
          </>
        )}
      </View>

      {/* Contenido Principal (Mapa o Vistas Simples) */}
      <View style={styles.mainContentArea}>{renderMainContent()}</View>

      {/* Controles (Siempre Visibles, Posicionados Absolutamente) */}
      <View style={styles.controlsContainer}>
        <WalkControls />
      </View>

      {/* Modales (Siempre Renderizados, Controlados por Visibilidad) */}
      <CaptureModal
        visible={isCaptureModalVisible}
        encounter={selectedEncounter}
        onClose={handleCloseCaptureModal}
      />
      <WalkSummaryModal
        isVisible={isSummaryModalVisible}
        onClose={() => setIsSummaryModalVisible(false)}
        walkSummary={walkSummary} // Pasa el resumen al modal
        onPokemonEncounterPress={handlePokemonEncounterPress} // Pasa el handler
      />
    </SafeAreaView>
  );
}

// --- Estilos (Añadidos y Ajustados) ---
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f4f4' }, // Fondo general un poco gris
  playerInfoBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.75)', // Ligeramente más opaco
    paddingHorizontal: 10,
    paddingVertical: 5,
    height: 60, // Altura fija
    zIndex: 10, // Asegura que esté sobre el contenido principal
  },
  playerInfoPic: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    borderWidth: 1,
    borderColor: '#fff',
    marginRight: 10,
    backgroundColor: '#555',
  },
  playerInfoTextContainer: { flex: 1, justifyContent: 'center' },
  playerNameText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  playerLevelText: { color: '#ddd', fontSize: 13 },
  miniXpBarContainer: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 3,
    marginTop: 3,
    width: '100%',
  },
  miniXpBarFilled: {
    height: '100%',
    backgroundColor: '#81d4fa', // Azul claro para XP
    borderRadius: 3,
  },
  summaryButton: {
    marginLeft: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#FFCC00', // Amarillo Pokémon
    borderRadius: 15,
  },
  summaryButtonText: { color: '#333', fontWeight: 'bold', fontSize: 13 },

  // --- Estilos para Contenido Principal ---
  mainContentArea: {
    flex: 1, // Ocupa todo el espacio debajo de la barra de info
    // backgroundColor: '#e0e0e0', // Fondo mientras carga o para placeholders
  },
  mapContainerActual: {
    // Contenedor específico cuando el mapa SÍ se muestra
    flex: 1, // Ocupa todo el mainContentArea
  },
  placeholderContainer: {
    // Contenedor para las vistas Idle, Walking, Processing
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30, // Más padding
    backgroundColor: '#ECEFF1', // Un gris muy claro
  },
  idleImage: {
    width: 300,
    height: 300,
    marginBottom: 30,
    opacity: 1,
  },
  activityIndicator: {
    marginBottom: 20,
  },
  placeholderTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#37474F', // Gris oscuro azulado
    textAlign: 'center',
    marginBottom: 10,
  },
  placeholderText: {
    fontSize: 16,
    color: '#546E7A', // Gris medio
    textAlign: 'center',
    marginBottom: 8,
  },
  placeholderSubText: {
    fontSize: 14,
    color: '#78909C', // Gris más claro
    textAlign: 'center',
  },

  // --- Estilos para Controles ---
  controlsContainer: {
    position: 'absolute',
    bottom: 15, // Ligeramente más arriba
    left: 15,
    right: 15,
    zIndex: 10, // Asegura que esté sobre el contenido principal
    // Ajusta el estilo del componente WalkControls si necesitas fondo, etc.
  },
});
