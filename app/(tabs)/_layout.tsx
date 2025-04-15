// app/(tabs)/_layout.tsx
import React from 'react';
import { Tabs } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Platform } from 'react-native'; // Import Platform

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;
          const iconSize = size + 2; // Icono un poco más grande

          if (route.name === 'index') {
            iconName = focused ? 'walk' : 'walk-outline';
          } else if (route.name === 'pokedex') {
            iconName = focused ? 'list-circle' : 'list-circle-outline';
          } else if (route.name === 'backpack') {
            iconName = focused ? 'briefcase' : 'briefcase-outline';
          } else if (route.name === 'profile') {
            iconName = focused ? 'person-circle' : 'person-circle-outline';
          } else {
            iconName = 'alert-circle';
          }
          return <Ionicons name={iconName} size={iconSize} color={color} />;
        },
        tabBarActiveTintColor: '#E3350D', // Rojo Pokémon activo
        tabBarInactiveTintColor: 'gray',
        headerShown: false, // Oculta cabecera por defecto
        // Estilo para la barra de pestañas
        tabBarStyle: {
          height: Platform.OS === 'ios' ? 90 : 65, // Mayor altura
          paddingBottom: Platform.OS === 'ios' ? 30 : 5, // Padding inferior (más en iOS)
          paddingTop: 5, // Padding superior
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#e0e0e0',
        },
        // Estilo para las etiquetas de texto
        tabBarLabelStyle: {
          fontSize: 11,
          marginBottom: Platform.OS === 'ios' ? -15 : 5, // Ajuste fino de posición
        },
      })}
    >
      {/* Definición de cada pantalla/pestaña */}
      <Tabs.Screen name='index' options={{ title: 'Caminata' }} />
      <Tabs.Screen name='pokedex' options={{ title: 'Pokédex' }} />
      <Tabs.Screen name='backpack' options={{ title: 'Mochila' }} />
      <Tabs.Screen name='profile' options={{ title: 'Entrenador' }} />
    </Tabs>
  );
}
