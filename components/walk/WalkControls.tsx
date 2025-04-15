// src/components/walk/WalkControls.tsx
import React, { useEffect, useRef } from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Animated,
  Easing,
} from 'react-native';
import { useWalk } from '@/src/contexts/WalkContext';

// Carga la imagen de la Poké Ball
const pokeballIcon = require('../../assets/images/pokeball-placeholder.png');

export const WalkControls: React.FC = () => {
  const { isWalking, isProcessingWalk, startWalk, stopWalk } = useWalk();

  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isWalking) {
      Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();
    } else {
      rotateAnim.stopAnimation();
      rotateAnim.setValue(0);
    }
  }, [isWalking]);

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const handlePress = () => {
    if (isProcessingWalk) return;

    if (isWalking) {
      stopWalk();
    } else {
      startWalk();
    }
  };

  const buttonText = isWalking ? 'Terminar Caminata' : 'Iniciar Caminata';
  const isDisabled = isProcessingWalk;

  return (
    <View style={styles.outerContainer}>
      <TouchableOpacity
        style={[styles.buttonContainer, isDisabled && styles.disabledContainer]}
        onPress={handlePress}
        disabled={isDisabled}
        activeOpacity={0.7}
      >
        <Animated.Image
          source={pokeballIcon}
          style={[
            styles.pokeballImage,
            isWalking && { transform: [{ rotate: rotation }] },
          ]}
        />
        <Text style={styles.buttonText}>
          {isProcessingWalk ? 'Procesando caminata...' : buttonText}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    alignItems: 'center',
    paddingVertical: 10,
    backgroundColor: 'transparent',
  },
  buttonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f44336',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    minWidth: 250,
    height: 60,
  },
  disabledContainer: {
    backgroundColor: '#bdbdbd',
    elevation: 0,
    shadowOpacity: 0,
  },
  pokeballImage: {
    width: 30,
    height: 30,
    marginRight: 12,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
