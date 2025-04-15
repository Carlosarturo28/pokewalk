// app/(tabs)/profile.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  Button,
  Platform,
  Modal,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
// Usar alias
import { usePlayer } from '@/src/contexts/PlayerContext';
import { usePokedex } from '@/src/contexts/PokedexContext';
import { useBackpack } from '@/src/contexts/BackpackContext';
import { PokedexStatus } from '@/src/types';
import Ionicons from '@expo/vector-icons/Ionicons';
import {
  PROFILE_PICTURES,
  ProfilePictureOption,
  getProfilePictureSourceById,
} from '@/src/utils/profilePictures'; // Importar getter también
import { ProfilePictureSelectorModal } from '@/components/profile/ProfilePictureSelectorModal';

// Placeholder local si falla la carga o no hay selección
const profilePlaceholder = require('../../assets/images/profile-placeholder.png');
const shinyIcon = require('../../assets/images/is-shiny.png');

// --- Componente Barra XP (sin cambios) ---
const XPProgressBar: React.FC<{ currentXP: number; xpToNextLevel: number }> = ({
  currentXP,
  xpToNextLevel,
}) => {
  const progress =
    xpToNextLevel > 0
      ? Math.min(1, currentXP / xpToNextLevel)
      : currentXP > 0
      ? 1
      : 0;
  const percentage = Math.floor(progress * 100);
  return (
    <View style={styles.xpBarContainer}>
      <View style={[styles.xpBarFilled, { width: `${percentage}%` }]} />
      <Text style={styles.xpBarText}>
        {xpToNextLevel > 0
          ? `${currentXP} / ${xpToNextLevel} XP`
          : 'Nivel Máx.'}{' '}
        ({percentage}%)
      </Text>
    </View>
  );
};

export default function ProfileScreen() {
  const {
    playerStats,
    isPlayerLoading,
    setProfilePicture,
    setPlayerName,
    resetPlayerData,
  } = usePlayer();
  const {
    pokedex,
    isPokedexLoading: isPokedexContextLoading,
    resetPokedexData,
  } = usePokedex(); // Renombrado para evitar conflicto
  const { isBackpackLoading, resetBackpackData } = useBackpack();

  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(playerStats.playerName);
  const [isPicSelectorVisible, setIsPicSelectorVisible] = useState(false);

  // --- Callbacks (Selección Pic, Edición Nombre, Reset) ---
  const handleSelectProfilePic = (pictureId: string) => {
    setProfilePicture(pictureId);
    setIsPicSelectorVisible(false);
  };
  const handleNameEditToggle = () => {
    if (isEditingName) {
      if (tempName.trim() && tempName !== playerStats.playerName) {
        setPlayerName(tempName);
      }
    } else {
      setTempName(playerStats.playerName);
    }
    setIsEditingName(!isEditingName);
  };
  const handleResetData = () => {
    Alert.alert(
      'Confirmar Reseteo',
      '¿Borrar TODOS tus datos (Perfil, Pokédex, Mochila)? Esta acción no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Resetear Todo',
          style: 'destructive',
          onPress: async () => {
            console.log('Resetting all data...');
            try {
              await resetPlayerData();
              await resetPokedexData();
              await resetBackpackData();
              Alert.alert('Datos Reseteados', 'Progreso eliminado.');
            } catch (error) {
              console.error('Reset Error:', error);
              Alert.alert('Error', 'No se pudieron resetear los datos.');
            }
          },
        },
      ]
    );
  };

  // --- Cálculo Stats Pokédex (sin cambios) ---
  const calculatePokedexStats = () => {
    if (isPokedexContextLoading || pokedex.size === 0) {
      return { seen: 0, caught: 0, caughtPercentage: 0 };
    }
    let seen = 0,
      caught = 0;
    pokedex.forEach((e) => {
      if (e.status >= PokedexStatus.Seen) seen++;
      if (e.status === PokedexStatus.Caught) caught++;
    });
    const total = pokedex.size;
    const perc = total > 0 ? Math.round((caught / total) * 100) : 0;
    return { seen, caught, caughtPercentage: perc };
  };
  const pokedexStats = calculatePokedexStats();

  // --- Obtener fuente de imagen ---
  // Usamos la función helper para obtener la fuente correcta basada en el ID guardado
  const currentProfilePicSource = getProfilePictureSourceById(
    playerStats.profilePictureUri
  );

  // --- Renderizado ---
  if (isPlayerLoading || isPokedexContextLoading || isBackpackLoading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size='large' color='#FFCC00' />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Usamos ScrollView para contenido que pueda exceder la pantalla */}
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Sección Cabecera: Foto, Nombre, Nivel, XP */}
        <View style={styles.profileHeader}>
          <TouchableOpacity
            onPress={() => setIsPicSelectorVisible(true)}
            style={styles.profilePicContainer}
          >
            <Image source={currentProfilePicSource} style={styles.profilePic} />
            <View style={styles.cameraIconOverlay}>
              <Ionicons name='images' size={18} color='white' />
            </View>
          </TouchableOpacity>
          <View style={styles.nameLevelContainer}>
            {isEditingName ? (
              <TextInput
                style={styles.nameInput}
                value={tempName}
                onChangeText={setTempName}
                autoFocus
                onBlur={handleNameEditToggle}
                maxLength={20}
              />
            ) : (
              <Text style={styles.playerName}>{playerStats.playerName}</Text>
            )}
            <TouchableOpacity
              onPress={handleNameEditToggle}
              style={styles.editIcon}
            >
              <Ionicons
                name={isEditingName ? 'save' : 'pencil'}
                size={20}
                color='#555'
              />
            </TouchableOpacity>
          </View>
          <Text style={styles.levelText}> {playerStats.level}</Text>
          <XPProgressBar
            currentXP={playerStats.currentXP}
            xpToNextLevel={playerStats.xpToNextLevel}
          />
        </View>

        {/* Sección Estadísticas */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Estadísticas</Text>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Distancia Caminada:</Text>
            <Text style={styles.statValue}>
              {(playerStats.totalDistanceWalked / 1000).toFixed(2)} km
            </Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Pokémon Capturados:</Text>
            <Text style={styles.statValue}>
              {playerStats.totalPokemonCaught}
            </Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Pokémon Vistos:</Text>
            <Text style={styles.statValue}>{pokedexStats.seen}</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Registrados (Pokédex):</Text>
            <Text style={styles.statValue}>
              {pokedexStats.caught} ({pokedexStats.caughtPercentage}%)
            </Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Shinies Capturados:</Text>
            <Text style={styles.statValue}>
              {playerStats.totalShinyCaught}{' '}
              <Image
                source={shinyIcon}
                style={styles.shinyIcon}
                resizeMode='contain'
              />
            </Text>
          </View>
        </View>

        {/* Sección Ajustes (con botón Reset) */}
        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>Ajustes</Text>
          <Button
            title='Resetear Datos del Juego'
            color='#e74c3c'
            onPress={handleResetData}
          />
          <Text style={styles.resetWarning}>
            ¡Cuidado! Esto borrará todo tu progreso.
          </Text>
        </View>
      </ScrollView>

      {/* Modal Selector de Imagen */}
      <ProfilePictureSelectorModal
        isVisible={isPicSelectorVisible}
        onClose={() => setIsPicSelectorVisible(false)}
        onSelectPicture={handleSelectProfilePic}
      />
    </SafeAreaView>
  );
}

// --- Estilos (sin cambios respecto a la versión anterior) ---
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f5f5f5' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContainer: { paddingBottom: 30 },
  shinyIcon: { width: 16, height: 16, marginLeft: 2 },
  profileHeader: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    marginBottom: 15,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  profilePicContainer: { marginBottom: 15, position: 'relative' },
  profilePic: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: '#4a90e2',
    backgroundColor: '#eee' /* Fondo mientras carga */,
  },
  cameraIconOverlay: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    padding: 6,
    borderRadius: 15,
  },
  nameLevelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  playerName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginRight: 8,
  },
  nameInput: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    borderBottomWidth: 1,
    borderColor: '#ccc',
    paddingVertical: 2,
    minWidth: 150,
    textAlign: 'center',
    marginRight: 8,
  },
  editIcon: { padding: 5 },
  levelText: { fontSize: 18, color: '#555', marginBottom: 10 },
  xpBarContainer: {
    width: '80%',
    height: 22,
    backgroundColor: '#e0e0e0',
    borderRadius: 11,
    marginTop: 5,
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'center',
  },
  xpBarFilled: { height: '100%', backgroundColor: '#64b5f6', borderRadius: 11 },
  xpBarText: {
    position: 'absolute',
    width: '100%',
    textAlign: 'center',
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
  },
  statsSection: {
    marginTop: 10,
    marginHorizontal: 10,
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
    borderBottomWidth: 1,
    borderColor: '#eee',
    paddingBottom: 8,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  statLabel: { fontSize: 16, color: '#555' },
  statValue: { fontSize: 16, fontWeight: '600', color: '#333' },
  settingsSection: {
    marginTop: 20,
    marginHorizontal: 10,
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderColor: '#e74c3c',
    borderWidth: 1,
  },
  resetWarning: {
    marginTop: 8,
    textAlign: 'center',
    fontSize: 12,
    color: '#e74c3c',
  },
});
