import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  Button,
  ActivityIndicator,
  BackHandler, // Añadido BackHandler
  ScrollView, // Para evitar cierre al tocar contenido
} from 'react-native';
// Importa Portal de Gorhom
import { Portal } from '@gorhom/portal';
import { useNotification } from '@/src/contexts/NotificationContext'; // Ajusta ruta
import { PokemonEncounter, PokedexStatus, Item } from '@/src/types'; // Ajusta ruta
import {
  POKEBALLS,
  BERRY_DATA,
  LUCKY_EGG_XP_MULTIPLIER,
} from '@/src/utils/constants'; // Ajusta ruta
import { calculateCatchChance } from '@/src/utils/helpers'; // Ajusta ruta
import { usePokedex } from '@/src/contexts/PokedexContext'; // Ajusta ruta
import { useWalk } from '@/src/contexts/WalkContext'; // Ajusta ruta
import { useBackpack } from '@/src/contexts/BackpackContext'; // Ajusta ruta
import { usePlayer } from '@/src/contexts/PlayerContext'; // Ajusta ruta
import { MODAL_PORTAL_HOST } from '@/app/_layout';

const placeholderSprite = require('../../assets/images/pokeball-placeholder.png'); // Ajusta ruta
const shinyIcon = require('../../assets/images/is-shiny.png'); // Ajusta ruta
const imgGotcha = require('../../assets/images/toast/gotcha.png'); // Ajusta ruta
const imgEscaped = require('../../assets/images/toast/escaped.png'); // Ajusta ruta
const imgOOBerry = require('../../assets/images/toast/outOfBerries.png'); // Ajusta ruta
const imgBerry = require('../../assets/images/toast/berries.png'); // Ajusta ruta
const imgErrorGeneric = require('../../assets/images/toast/error.png'); // Ajusta ruta
const imgLuckyEgg = require('../../assets/images/toast/lucky_egg.png'); // Ajusta ruta
const imgPokeball = require('../../assets/images/toast/oopokeboalls.png'); // Ajusta ruta

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

  // Resetea estado interno al ocultar/cambiar encounter
  useEffect(() => {
    if (!visible) {
      setActiveBerry(null);
      setIsAttemptingCapture(false); // Asegura resetear estado de intento
    }
  }, [visible]);
  useEffect(() => {
    setActiveBerry(null);
  }, [encounter?.id]);

  // Manejo del botón Atrás en Android
  useEffect(() => {
    const backAction = () => {
      if (visible && !isAttemptingCapture) {
        // Solo cerrar si no está en proceso de captura
        onClose();
        return true;
      }
      return false;
    };
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction
    );
    return () => backHandler.remove();
  }, [visible, onClose, isAttemptingCapture]); // Depende de isAttemptingCapture

  // Lógica de captura y uso de bayas (sin cambios internos)
  const handleAttemptCapture = (pokeballId: keyof typeof POKEBALLS) => {
    // ... (código de handleAttemptCapture igual que antes) ...
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
    const pokemon = encounter!.pokemonDetails; // Usar '!' porque ya validamos encounter
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
        const wasAlreadyCaught =
          getPokemonStatus(pokemon.id) === PokedexStatus.Caught;
        const isNewEntry = !wasAlreadyCaught;
        const isShiny = encounter!.isShiny;
        showNotification({
          type: 'success',
          title: isShiny ? '✨ ¡Increíble!' : 'Gotcha!',
          message:
            `¡${
              pokemon.name.charAt(0).toUpperCase() + pokemon.name.slice(1)
            } fue atrapado!` + (isShiny ? ' ¡Es un shiny!' : ''),
          imageSource: imgGotcha,
        });
        updatePokedexEntry(
          pokemon.id,
          PokedexStatus.Caught,
          isShiny ? pokemon.sprites.front_shiny : pokemon.sprites.front_default,
          isShiny,
          pokeballId,
          pokemon.types
        );
        markEncounterAsCaught(encounter!.id);
        let xpMultiplier = 1.0;
        let luckyEggWasUsed = false;
        if (hasItem('lucky-egg')) {
          if (useItem('lucky-egg', 1)) {
            xpMultiplier = LUCKY_EGG_XP_MULTIPLIER;
            luckyEggWasUsed = true;
            console.log('Lucky Egg consumed! XP x', xpMultiplier);
          }
        }
        recordPokemonCatch(isShiny, isNewEntry, xpMultiplier);
        if (luckyEggWasUsed) {
          const luckyEggDelay = 2000;
          setTimeout(() => {
            showNotification({
              type: 'info',
              title: '¡Huevo Suerte activado!',
              message: `¡Experiencia x${xpMultiplier}!`,
              imageSource: imgLuckyEgg,
            });
          }, luckyEggDelay);
        }
        setIsAttemptingCapture(false);
        onClose();
      } else {
        showNotification({
          type: 'error',
          title: '¡Oh, no!',
          message: `¡El ${pokemon.name} salvaje se ha escapado!`,
          imageSource: imgEscaped,
        });
        removeEncounterFromSummary(encounter!.id);
        setIsAttemptingCapture(false);
        onClose();
      }
    }, 1200);
  };
  const handleUseBerry = (berryId: string) => {
    // ... (código de handleUseBerry igual que antes) ...
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
          `Puede que ${
            encounter!.pokemonDetails.name
          } sea más fácil de atrapar.`,
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

  // No renderizar si no es visible o no hay encounter
  if (!visible || !encounter) {
    return null;
  }

  const spriteUri = encounter.isShiny
    ? encounter.pokemonDetails.sprites.front_shiny
    : encounter.pokemonDetails.sprites.front_default;

  return (
    // Usa Portal de Gorhom
    <Portal hostName={MODAL_PORTAL_HOST}>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalView}>
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
              {' '}
              ¡{activeBerry.name} activa!{' '}
            </Text>
          )}
          {isAttemptingCapture ? (
            <View style={styles.loadingView}>
              <ActivityIndicator size='large' color='#FFCC00' />
              <Text>Lanzando Poké Ball...</Text>
            </View>
          ) : (
            <>
              <ScrollView style={styles.captureOptions}>
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
              </ScrollView>
              <View
                style={[styles.buttonWrapper, { marginTop: 15, width: '100%' }]}
              >
                <Button title='Huir' onPress={onClose} color='grey' />
              </View>
            </>
          )}
        </View>
      </View>
    </Portal>
  );
};

// Estilos ajustados para el modal falso
const styles = StyleSheet.create({
  modalBackdrop: {
    // Renombrado de modalCenteredView
    ...StyleSheet.absoluteFillObject, // Cubre toda la pantalla
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    zIndex: 3, // Asegura estar encima
  },
  modalView: {
    // Contenedor visible
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
    maxHeight: '90%', // Ajusta si es necesario
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
  modalSprite: { width: 180, height: 180 },
  berryActiveText: {
    fontSize: 16,
    color: 'green',
    fontWeight: 'bold',
    marginBottom: 8,
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
