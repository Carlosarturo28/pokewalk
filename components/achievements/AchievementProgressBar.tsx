import React from 'react';
import { View, StyleSheet } from 'react-native';

interface Props {
  progress: number; // Porcentaje de 0 a 100
  size?: number; // Diámetro del círculo
  strokeWidth?: number; // Grosor de la línea
  backgroundColor?: string; // Color del fondo del círculo
  progressColor?: string; // Color del progreso
}

const AchievementProgressBar: React.FC<Props> = ({
  progress = 0,
  size = 50,
  strokeWidth = 4,
  backgroundColor = '#e6e6e6',
  progressColor = '#4CAF50', // Verde por defecto
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  // Clamp progress entre 0 y 100
  const clampedProgress = Math.max(0, Math.min(100, progress));
  const strokeDashoffset = circumference - (clampedProgress / 100) * circumference;

  // Nota: React Native no tiene SVG integrado. Usar una librería o un enfoque con Views.
  // Este ejemplo usa Views anidadas para SIMULAR una barra circular.
  // Para una barra circular real y más precisa, considera usar react-native-svg
  // o react-native-progress. Este es un enfoque simple con Views.

  const progressStyle = {
    width: `${clampedProgress}%`,
    backgroundColor: progressColor,
  };

  // --- Enfoque con View Lineal (Más simple) ---
  return (
    <View style={[styles.linearBackground, { height: strokeWidth * 2, borderRadius: strokeWidth, backgroundColor }]}>
      <View style={[styles.linearFill, progressStyle, { height: strokeWidth * 2, borderRadius: strokeWidth }]} />
    </View>
  );

  // --- Enfoque Circular Simulado con Views (Más complejo, menos preciso que SVG) ---
  // Si prefieres intentar uno circular (requiere más ajuste):
  /*
  return (
    <View style={[styles.circleContainer, { width: size, height: size }]}>
      <View style={[styles.circleBackground, { borderColor: backgroundColor, borderWidth: strokeWidth, borderRadius: size / 2 }]} />
      {/* Aquí necesitarías lógica más compleja con transformaciones o librerías para el arco
    </View>
  );
  */
};

const styles = StyleSheet.create({
  // Estilos para Barra Lineal
  linearBackground: {
    width: '100%', // Ocupa el 80% del ancho disponible
    overflow: 'hidden',
    alignSelf: 'center', // Centrar la barra
    marginTop: 5,
  },
  linearFill: {
    // Estilos base del relleno
  },

  // Estilos para Barra Circular (Básico, necesitaría mejoras)
  /*
  circleContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  circleBackground: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  */
});

export default AchievementProgressBar;