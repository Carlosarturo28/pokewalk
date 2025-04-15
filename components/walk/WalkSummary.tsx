// src/components/walk/WalkSummary.tsx
import React from 'react';
import { View, Text, SectionList, StyleSheet } from 'react-native';
// Usar alias e importar WalkSummary desde types
import { EncounterItem } from './EncounterItem';
import { ItemEncounterItem } from './ItemEncounterItem';
import {
  Encounter,
  PokemonEncounter,
  ItemEncounter,
  WalkSummary as WalkSummaryType,
} from '@/src/types';

interface Props {
  walkSummary: WalkSummaryType | null; // Usa el tipo importado
  onPokemonEncounterPress: (encounter: PokemonEncounter) => void;
}

interface SummarySection {
  title: string;
  data: Encounter[];
}

export const WalkSummary: React.FC<Props> = ({
  walkSummary,
  onPokemonEncounterPress,
}) => {
  if (
    !walkSummary ||
    !walkSummary.encounters ||
    walkSummary.encounters.length === 0
  ) {
    return (
      <View style={[styles.container, { flex: 1, justifyContent: 'center' }]}>
        <Text style={styles.mainTitle}>Resumen de la Caminata</Text>
        <Text style={styles.emptyText}>
          No encontraste nada en esta caminata.
        </Text>
      </View>
    );
  }

  const pokemonEncounters = walkSummary.encounters.filter(
    (e): e is PokemonEncounter => e.type === 'pokemon'
  );
  const itemEncounters = walkSummary.encounters.filter(
    (e): e is ItemEncounter => e.type === 'item'
  );

  const sections: SummarySection[] = [];
  if (pokemonEncounters.length > 0)
    sections.push({ title: 'Pokémon Encontrados', data: pokemonEncounters });
  if (itemEncounters.length > 0)
    sections.push({ title: 'Objetos Obtenidos', data: itemEncounters });

  return (
    <View style={styles.container}>
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          if (item.type === 'pokemon') {
            return (
              <EncounterItem
                encounter={item as PokemonEncounter}
                onCapturePress={onPokemonEncounterPress}
              />
            );
          } else if (item.type === 'item') {
            return <ItemEncounterItem encounter={item as ItemEncounter} />;
          }
          return null;
        }}
        renderSectionHeader={({ section: { title } }) => (
          <Text style={styles.sectionHeader}>{title}</Text>
        )}
        ListHeaderComponent={
          <Text style={styles.mainTitle}>Resumen de la Caminata</Text>
        }
        stickySectionHeadersEnabled={false}
        contentContainerStyle={styles.listContentContainer}
      />
    </View>
  );
};

// --- Estilos (sin cambios) ---
const styles = StyleSheet.create({
  container: { backgroundColor: '#f8f8f8' },
  listContentContainer: { paddingBottom: 20 },
  mainTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    padding: 15,
    backgroundColor: '#eee',
    textAlign: 'center',
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    paddingTop: 15,
    paddingBottom: 8,
    paddingHorizontal: 15,
    backgroundColor: '#f0f0f0',
    color: '#444',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  emptyText: { padding: 20, textAlign: 'center', color: '#666' },
});
