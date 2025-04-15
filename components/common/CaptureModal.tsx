// src/components/common/CaptureModal.tsx
import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  Image,
  StyleSheet,
  Button,
  ActivityIndicator,
  ImageSourcePropType,
} from 'react-native';
// Importa el hook del nuevo contexto de notificación
import { useNotification } from '@/src/contexts/NotificationContext';

// --- Alias y Tipos ---
import { PokemonEncounter, PokedexStatus, Item } from '@/src/types';
import {
  POKEBALLS,
  BERRY_DATA,
  LUCKY_EGG_XP_MULTIPLIER,
} from '@/src/utils/constants';
import { calculateCatchChance } from '@/src/utils/helpers';

// --- Contextos ---
import { usePokedex } from '@/src/contexts/PokedexContext';
import { useWalk } from '@/src/contexts/WalkContext';
import { useBackpack } from '@/src/contexts/BackpackContext';
import { usePlayer } from '@/src/contexts/PlayerContext';

// --- Assets ---
const placeholderSprite = require('../../assets/images/pokeball-placeholder.png'); // Alias
const shinyIcon = require('../../assets/images/is-shiny.png'); // Alias

// --- Imágenes para Toasts (Ajusta las rutas si es necesario) ---
const imgGotcha = require('../../assets/images/toast/gotcha.png');
const imgEscaped = require('../../assets/images/toast/escaped.png');
const imgOOBerry = require('../../assets/images/toast/outOfBerries.png');
const imgBerry = require('../../assets/images/toast/berries.png');
// const imgItemInfo = require('../../assets/images/toast/item_info.png'); // Descomenta si lo usas
const imgErrorGeneric = require('../../assets/images/toast/error.png');
const imgLuckyEgg = require('../../assets/images/toast/lucky_egg.png');
const imgPokeball = require('../../assets/images/toast/oopokeboalls.png'); // O una imagen de bolsa vacía

interface Props {
  visible: boolean;
  encounter: PokemonEncounter | null;
  onClose: () => void;
}

export const CaptureModal: React.FC<Props> = ({
  visible,
  encounter,
  onClose,
}) => {
  const [isAttemptingCapture, setIsAttemptingCapture] = useState(false);
  const [activeBerry, setActiveBerry] = useState<Item | null>(null);

  const { updatePokedexEntry, getPokemonStatus } = usePokedex();
  const { markEncounterAsCaught, removeEncounterFromSummary } = useWalk();
  const { backpack, useItem, hasItem } = useBackpack();
  const { recordPokemonCatch } = usePlayer();
  const { showNotification } = useNotification();

  useEffect(() => {
    if (!visible) setActiveBerry(null);
  }, [visible]);
  useEffect(() => {
    setActiveBerry(null);
  }, [encounter?.id]);

  if (!encounter) return null;

  const handleAttemptCapture = (pokeballId: keyof typeof POKEBALLS) => {
    const currentBallCount = backpack.get(pokeballId) ?? 0;
    if (currentBallCount <= 0) {
      showNotification({
        type: 'error',
        title: '¡Bolsa Vacía!',
        message: `¡No quedan ${POKEBALLS[pokeballId].name}!`,
        imageSource: imgPokeball,
      });
      return;
    }

    setIsAttemptingCapture(true);
    const pokemon = encounter.pokemonDetails;
    const berryModifier = activeBerry?.effect?.catchRateModifier ?? 1.0;
    const catchChance = calculateCatchChance(
      pokemon.capture_rate,
      pokeballId,
      berryModifier
    );
    const success = Math.random() < catchChance;

    console.log(
      `Capture attempt: ${
        pokemon.name
      } with ${pokeballId}. Chance: ${catchChance.toFixed(
        3
      )}. Success: ${success}`
    );
    useItem(pokeballId, 1);
    setActiveBerry(null);

    setTimeout(() => {
      if (success) {
        // --- Captura Exitosa ---
        const wasAlreadyCaught =
          getPokemonStatus(pokemon.id) === PokedexStatus.Caught;
        const isNewEntry = !wasAlreadyCaught;
        const isShiny = encounter.isShiny;

        // 1. Muestra la notificación de captura INMEDIATAMENTE
        showNotification({
          type: 'success',
          title: isShiny ? '✨ ¡Increíble!' : '¡Gotcha!',
          message:
            `${pokemon.name} fue atrapado!` +
            (isShiny ? ' ¡Es un Variocolor!' : ''),
          imageSource: imgGotcha,
        });

        // 2. Realiza las actualizaciones de estado
        updatePokedexEntry(
          pokemon.id,
          PokedexStatus.Caught,
          isShiny ? pokemon.sprites.front_shiny : pokemon.sprites.front_default,
          isShiny,
          pokeballId
        );
        markEncounterAsCaught(encounter.id);

        // 3. Prepara la lógica del Huevo Suerte
        let xpMultiplier = 1.0;
        let luckyEggWasUsed = false; // Flag para saber si mostrar la segunda notificación
        if (hasItem('lucky-egg')) {
          if (useItem('lucky-egg', 1)) {
            xpMultiplier = LUCKY_EGG_XP_MULTIPLIER;
            luckyEggWasUsed = true; // Marca que se usó
            console.log('Lucky Egg consumed! XP x', xpMultiplier);
          }
        }
        // Registra la captura (esto puede calcular el XP internamente)
        recordPokemonCatch(isShiny, isNewEntry, xpMultiplier);

        // 4. Si se usó el Huevo Suerte, muestra su notificación DESPUÉS de un retraso
        if (luckyEggWasUsed) {
          const luckyEggDelay = 2000; // Retraso en ms (ej. 2 segundos)
          setTimeout(() => {
            showNotification({
              type: 'info',
              title: '¡Huevo Suerte activado!',
              message: `¡Experiencia x${xpMultiplier}!`,
              imageSource: imgLuckyEgg,
            });
          }, luckyEggDelay);
        }

        // 5. Cierra el modal (esto puede ocurrir antes de que aparezca la segunda notificación)
        setIsAttemptingCapture(false);
        onClose();
      } else {
        // --- Captura Fallida ---
        showNotification({
          type: 'error',
          title: '¡Oh, no!',
          message: `¡El ${pokemon.name} salvaje se ha escapado!`,
          imageSource: imgEscaped,
        });
        removeEncounterFromSummary(encounter.id);
        setIsAttemptingCapture(false);
        onClose();
      }
    }, 1200); // Delay simulado inicial
  };

  // --- Lógica de Uso de Bayas (sin cambios) ---
  const handleUseBerry = (berryId: string) => {
    const berry = BERRY_DATA[berryId];
    if (!berry) return;
    const currentBerryCount = backpack.get(berryId) ?? 0;
    if (currentBerryCount <= 0) {
      showNotification({
        type: 'error',
        title: '¡Sin Bayas!',
        message: `¡Ya no te quedan ${berry.name}!`,
        imageSource: imgOOBerry,
      });
      return;
    }

    if (useItem(berryId, 1)) {
      setActiveBerry(berry);
      showNotification({
        type: 'info',
        title: `¡Usaste ${berry.name}!`,
        message:
          berry.description ??
          `Puede que ${encounter.pokemonDetails.name} sea más fácil de atrapar.`,
        imageSource: imgBerry,
      });
    } else {
      showNotification({
        type: 'error',
        title: '¡Acción fallida!',
        message: `No se pudo usar ${berry.name}.`,
        imageSource: imgErrorGeneric,
      });
    }
  };

  const spriteUri = encounter.isShiny
    ? encounter.pokemonDetails.sprites.front_shiny
    : encounter.pokemonDetails.sprites.front_default;

  // --- Renderizado del Modal (JSX sin cambios) ---
  return (
    <Modal
      animationType='slide'
      transparent={true}
      visible={visible}
      onRequestClose={() => {
        if (!isAttemptingCapture) onClose();
      }}
    >
      <View style={styles.modalCenteredView}>
        <View style={styles.modalView}>
          {/* ... (El JSX del título, imagen, botones, etc. sigue igual) ... */}
          <View style={styles.titleContainer}>
            <Text style={styles.modalTitle}>
              ¡Un {encounter.pokemonDetails.name} salvaje!
            </Text>
            {encounter.isShiny && (
              <Image
                source={shinyIcon}
                style={styles.titleShinyIcon}
                resizeMode='contain'
              />
            )}
          </View>
          <Image
            source={spriteUri ? { uri: spriteUri } : placeholderSprite}
            style={styles.modalSprite}
            resizeMode='contain'
          />
          {activeBerry && (
            <Text style={styles.berryActiveText}>
              ¡{activeBerry.name} activa!
            </Text>
          )}
          {isAttemptingCapture ? (
            <View style={styles.loadingView}>
              <ActivityIndicator size='large' color='#FFCC00' />
              <Text>Lanzando Poké Ball...</Text>
            </View>
          ) : (
            <View style={styles.captureOptions}>
              {/* Sección de Bayas */}
              <View style={styles.sectionContainer}>
                <Text style={styles.optionsTitle}>Usar Baya:</Text>
                {Object.keys(BERRY_DATA).map((berryId) => {
                  const berry = BERRY_DATA[berryId];
                  const count = backpack.get(berryId) ?? 0;
                  const isDisabled = count <= 0 || !!activeBerry;
                  return (
                    <View key={berryId} style={styles.buttonWrapper}>
                      <Button
                        title={`Usar ${berry.name} (${count})`}
                        onPress={() => handleUseBerry(berryId)}
                        disabled={isDisabled}
                        color={
                          activeBerry?.id === berryId
                            ? 'green'
                            : isDisabled && !activeBerry
                            ? 'grey'
                            : '#FF7F00'
                        }
                      />
                    </View>
                  );
                })}
              </View>
              {/* Sección de Poké Balls */}
              <View style={styles.sectionContainer}>
                <Text style={styles.optionsTitle}>Lanzar Poké Ball:</Text>
                {Object.entries(POKEBALLS).map(([key, ball]) => {
                  const pokeballId = key as keyof typeof POKEBALLS;
                  const count = backpack.get(pokeballId) ?? 0;
                  const isDisabled = count <= 0;
                  return (
                    <View key={pokeballId} style={styles.buttonWrapper}>
                      <Button
                        title={`Usar ${ball.name} (${count})`}
                        onPress={() => handleAttemptCapture(pokeballId)}
                        disabled={isDisabled}
                      />
                    </View>
                  );
                })}
              </View>
              {/* Botón de Huir */}
              <View style={[styles.buttonWrapper, { marginTop: 15 }]}>
                <Button title='Huir' onPress={onClose} color='grey' />
              </View>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

// --- Estilos (Sin cambios) ---
const styles = StyleSheet.create({
  modalCenteredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  modalView: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 25,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: '85%',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    textTransform: 'capitalize',
    marginRight: 8,
  },
  titleShinyIcon: { width: 22, height: 22 },
  modalSprite: { width: 180, height: 180, marginBottom: 15 },
  berryActiveText: {
    fontSize: 16,
    color: 'green',
    fontWeight: 'bold',
    marginBottom: 15,
    fontStyle: 'italic',
  },
  captureOptions: { marginTop: 15, width: '100%' },
  sectionContainer: {
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 5,
    padding: 10,
  },
  optionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 10,
  },
  buttonWrapper: { marginVertical: 5 },
  loadingView: { alignItems: 'center', padding: 20 },
});
