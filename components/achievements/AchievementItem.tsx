import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { AchievementDefinition, AchievementProgressData } from '@/src/types/Achievement'; // Ajusta ruta
import AchievementProgressBar from './AchievementProgressBar';
import Ionicons from '@expo/vector-icons/Ionicons';

interface Props {
  achievement: AchievementDefinition;
  progressData?: AchievementProgressData; // El progreso puede ser undefined si aún no se cargó
}

export const AchievementItem: React.FC<Props> = ({ achievement, progressData }) => {
  const currentProgress = progressData?.currentValue ?? 0;
  const goal = achievement.goal;
  const isAchieved = progressData?.achieved ?? false;
  const progressPercent = goal > 0 ? Math.min(100, (currentProgress / goal) * 100) : (isAchieved ? 100 : 0);

  const rewardText = achievement.rewards.map(r => `${r.quantity} ${r.itemId}`).join(', ');

  return (
    <View style={[styles.container, isAchieved && styles.achievedContainer]}>
      <View style={styles.medalContainer}>
        <Image source={achievement.medalImage} style={styles.medalImage} />
      </View>
      <View style={styles.infoContainer}>
        <Text style={[styles.title, isAchieved && styles.achievedText]}>
          {achievement.title}
        </Text>
        <Text style={styles.description}>{achievement.description}</Text>
        {!isAchieved && ( // Muestra progreso solo si no está completado
             <>
                 <AchievementProgressBar progress={progressPercent} />
                 <Text style={styles.progressText}>
                     {currentProgress} / {goal}
                 </Text>
             </>
        )}
         {isAchieved && rewardText && ( // Muestra recompensa si está completado y hay recompensa
            <Text style={styles.rewardText}>Recompensa: {rewardText}</Text>
         )}
      </View>
       {isAchieved && (
           <View style={styles.checkMarkContainer}>
               <Ionicons name="checkmark-circle" size={24} color="green" />
           </View>
       )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 10,
    marginVertical: 5,
    marginHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#eee',
    alignItems: 'center', // Centra verticalmente
    overflow: 'hidden',
  },
  achievedContainer: {
    borderColor: '#FFD700', // Borde dorado para completados
    backgroundColor: '#FFFCEC', // Fondo ligeramente amarillo
  },
  medalContainer: {
    width: 60,
    height: 60,
    marginRight: 15,
    justifyContent: 'center',
    alignItems: 'center',
    // backgroundColor: '#f0f0f0', // Fondo opcional
    borderRadius: 30,
  },
  medalImage: {
    width: 55,
    height: 55,
    resizeMode: 'contain',
  },
  infoContainer: {
    flex: 1, // Ocupa el espacio restante
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  achievedText: {
     color: '#4CAF50', // Verde para títulos logrados
  },
  description: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
    marginBottom: 5,
  },
  progressText: {
    fontSize: 11,
    color: '#888',
    textAlign: 'center',
    marginTop: 3,
  },
  rewardText: {
      fontSize: 12,
      color: '#4CAF50', // Verde
      fontStyle: 'italic',
      marginTop: 5,
  },
  checkMarkContainer: {
      marginLeft: 10, // Espacio a la izquierda del checkmark
      padding: 5,
  },
});