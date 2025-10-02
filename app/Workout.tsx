import { FontAwesome, FontAwesome5, Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Animated,
    Dimensions,
    FlatList,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

const { width } = Dimensions.get('window');

const WorkoutPlan = () => {
  const router = useRouter();
  const pulseAnim = new Animated.Value(1);
  
  // Define types based on your backend schema
  type Exercise = {
    name: string;
    sets: number;
    reps: number;
    weight?: number;
    notes?: string;
    completed?: boolean;
  };
  
  type DayWorkout = {
    day: string;
    title: string;
    exercises: Exercise[];
    _id: string;
  };
  
  type WorkoutPlanType = {
    _id: string;
    user: string;
    days: DayWorkout[];
    createdAt: string;
    __v: number;
  };
  
  const [workoutPlan, setWorkoutPlan] = useState<WorkoutPlanType | null>(null);
  const [completedExercises, setCompletedExercises] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [currentDayWorkout, setCurrentDayWorkout] = useState<DayWorkout | null>(null);

  Animated.loop(
    Animated.sequence([
      Animated.timing(pulseAnim, {
        toValue: 1.05,
        duration: 1000,
        useNativeDriver: true
      }),
      Animated.timing(pulseAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true
      })
    ])
  ).start();

  // Function to get current day of the week
  const getCurrentDay = () => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const today = new Date().getDay();
    return days[today];
  };

  useEffect(() => {
    const fetchWorkoutPlan = async () => {
      try {
        const token = await AsyncStorage.getItem('Token');
        const response = await fetch('http://192.168.29.104:3000/Workout/', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch workout plan');
        }
        
        const data = await response.json();
        setWorkoutPlan(data[0]); // Assuming you get an array and we take the first plan
        
        // Find today's workout
        const currentDay = getCurrentDay();
        const todayWorkout = data[0]?.days.find((day: DayWorkout) => day.day === currentDay);
        
        if (todayWorkout) {
          setCurrentDayWorkout(todayWorkout);
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching workout plan:', error);
        setIsLoading(false);
      }
    };

    fetchWorkoutPlan();
  }, []);

  const toggleExerciseCompletion = (exerciseId: string) => {
    setCompletedExercises(prev => ({
      ...prev,
      [exerciseId]: !prev[exerciseId]
    }));
  };

  const calculateCompletion = () => {
    if (!currentDayWorkout) return 0;
    
    const completedCount = currentDayWorkout.exercises.filter(
      exercise => completedExercises[exercise.name]
    ).length;
    
    return (completedCount / currentDayWorkout.exercises.length) * 100;
  };

  const saveWorkoutCompletion = async () => {
    try {
      const token = await AsyncStorage.getItem('Token');
      await fetch('http://192.168.29.104:3000/Workout/log-workout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          completed: true,
          exercises: completedExercises,
          day: currentDayWorkout?.day
        }),
      });
      
      router.back();
    } catch (error) {
      console.error('Error saving workout completion:', error);
    }
  };

  const renderExercise = ({ item, index }: { item: Exercise, index: number }) => (
    <View style={styles.exerciseCard}>
      <TouchableOpacity 
        style={styles.checkboxContainer}
        onPress={() => toggleExerciseCompletion(item.name)}
      >
        <View style={[
          styles.checkbox,
          completedExercises[item.name] && styles.checkboxChecked
        ]}>
          {completedExercises[item.name] && (
            <FontAwesome name="check" size={14} color="#00ff9d" />
          )}
        </View>
      </TouchableOpacity>
      
      <View style={styles.exerciseInfo}>
        <Text style={styles.exerciseName}>{item.name}</Text>
        <View style={styles.exerciseDetails}>
          <Text style={styles.exerciseDetail}>{item.sets} sets</Text>
          <Text style={styles.exerciseDetail}>{item.reps} reps</Text>
          {item.weight && <Text style={styles.exerciseDetail}>{item.weight} kg</Text>}
        </View>
        {item.notes && <Text style={styles.notes}>{item.notes}</Text>}
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['#0a0a0a', '#121212']}
          style={StyleSheet.absoluteFill}
        />
        
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#f0f0f0" />
          </TouchableOpacity>
          <View style={[styles.skeletonText, { width: 150, height: 24 }]} />
          <View style={{ width: 40 }} />
        </View>
        
        <View style={styles.progressContainer}>
          <View style={[styles.skeletonText, { width: '100%', height: 6, marginBottom: 5 }]} />
          <View style={[styles.skeletonText, { width: 60, height: 14, alignSelf: 'flex-end' }]} />
        </View>
        
        <View style={styles.workoutInfo}>
          <View style={[styles.skeletonText, { width: 120, height: 20, marginBottom: 10 }]} />
          <View style={[styles.skeletonText, { width: 80, height: 16 }]} />
        </View>
        
        <FlatList
          data={[1, 2, 3, 4, 5]}
          renderItem={() => (
            <View style={[styles.exerciseCard, styles.skeletonCard]}>
              <View style={[styles.skeletonText, { width: 24, height: 24, borderRadius: 12 }]} />
              <View style={styles.exerciseInfo}>
                <View style={[styles.skeletonText, { width: '70%', height: 16, marginBottom: 8 }]} />
                <View style={[styles.skeletonText, { width: '90%', height: 12 }]} />
              </View>
              <View style={[styles.skeletonText, { width: 24, height: 24 }]} />
            </View>
          )}
          keyExtractor={(item) => item.toString()}
          contentContainerStyle={styles.exercisesContainer}
        />
      </View>
    );
  }

  if (!workoutPlan || !currentDayWorkout) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['#0a0a0a', '#121212']}
          style={StyleSheet.absoluteFill}
        />
        
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#f0f0f0" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Today's Workout</Text>
          <TouchableOpacity onPress={() => router.push('/WorkoutSettings')}>
            <FontAwesome name="cog" size={24} color="#f0f0f0" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.noWorkoutContainer}>
          <FontAwesome5 name="dumbbell" size={64} color="#777" />
          <Text style={styles.noWorkoutText}>No workout scheduled for today</Text>
          <Text style={styles.noWorkoutSubText}>
            {getCurrentDay()} is your rest day. Enjoy your recovery!
          </Text>
          
          {/* Add Workout Plan Button */}
          <TouchableOpacity 
            style={styles.addPlanButton}
            onPress={() => router.push('/Workout_Input')}
          >
            <Text style={styles.addPlanButtonText}>Create Workout Plan</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0a0a0a', '#121212']}
        style={StyleSheet.absoluteFill}
      />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#f0f0f0" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Today's Workout</Text>
        <TouchableOpacity onPress={() => router.push('/WorkoutSettings')}>
          <FontAwesome name="cog" size={24} color="#f0f0f0" />
        </TouchableOpacity>
      </View>
      
      <ScrollView contentContainerStyle={styles.scrollContainer}>

        <View style={styles.progressContainer}>
          <View style={styles.progressLabels}>
            <Text style={styles.progressText}>Workout Progress</Text>
            <Text style={styles.progressPercentage}>{Math.round(calculateCompletion())}%</Text>
          </View>
          
          <View style={styles.progressBarBackground}>
            <LinearGradient
              colors={['#00f5ff', '#00ff9d']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.progressBarFill, { width: `${calculateCompletion()}%` }]}
            />
          </View>
        </View>
        
        <View style={styles.workoutInfo}>
          <Text style={styles.workoutTitle}>{currentDayWorkout.title}</Text>
          <View style={styles.workoutMeta}>
            <View style={styles.metaItem}>
              <FontAwesome5 name="calendar-day" size={14} color="#777" />
              <Text style={styles.metaText}>{currentDayWorkout.day}</Text>
            </View>
            <View style={styles.metaItem}>
              <FontAwesome5 name="dumbbell" size={14} color="#777" />
              <Text style={styles.metaText}>{currentDayWorkout.exercises.length} exercises</Text>
            </View>
          </View>
        </View>
        
        <FlatList
          data={currentDayWorkout.exercises}
          renderItem={renderExercise}
          keyExtractor={(item, index) => `${item.name}-${index}`}
          scrollEnabled={false}
          contentContainerStyle={styles.exercisesContainer}
        />
      </ScrollView>
      
      <Animated.View style={[styles.completeButton, { transform: [{ scale: pulseAnim }] }]}>
        <TouchableOpacity 
          style={[
            styles.completeButtonInner,
            calculateCompletion() === 100 && styles.completeButtonFull
          ]}
          onPress={saveWorkoutCompletion}
        >
          <Text style={styles.completeButtonText}>
            {calculateCompletion() === 100 ? 'Workout Completed!' : 'Mark as Complete'}
          </Text>
          {calculateCompletion() === 100 && (
            <FontAwesome name="check" size={18} color="white" style={{ marginLeft: 8 }} />
          )}
        </TouchableOpacity>
      </Animated.View>

      <TouchableOpacity 
        style={styles.floatingButton}
        onPress={() => router.push('/Workout_Input')}
      >
        <Ionicons name="add" size={24} color="#fff" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  scrollContainer: {
    padding: 20,
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 10,
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#ffffff',
  },
  progressContainer: {
    backgroundColor: '#121212',
    borderRadius: 16,
    padding: 15,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    marginBottom: 20,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  progressText: {
    fontSize: 14,
    color: '#777',
  },
  progressPercentage: {
    fontSize: 14,
    fontWeight: '600',
    color: '#00f5ff',
  },
  progressBarBackground: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  workoutInfo: {
    marginBottom: 25,
  },
  workoutTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 10,
  },
  workoutMeta: {
    flexDirection: 'row',
    gap: 15,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  metaText: {
    fontSize: 14,
    color: '#777',
  },
  exercisesContainer: {
    gap: 12,
  },
  exerciseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#121212',
    borderRadius: 16,
    padding: 15,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  checkboxContainer: {
    marginRight: 15,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#777',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    borderColor: '#00ff9d',
    backgroundColor: 'rgba(0,255,157,0.1)',
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 5,
  },
  exerciseDetails: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 5,
  },
  exerciseDetail: {
    fontSize: 12,
    color: '#777',
  },
  notes: {
    fontSize: 12,
    color: '#00f5ff',
    fontStyle: 'italic',
  },
  completeButton: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
    borderRadius: 16,
    overflow: 'hidden',
  },
  completeButtonInner: {
    backgroundColor: '#ff7b25',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  completeButtonFull: {
    backgroundColor: '#00ff9d',
  },
  completeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  noWorkoutContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  noWorkoutText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#ffffff',
    marginTop: 16,
    marginBottom: 8,
  },
  noWorkoutSubText: {
    fontSize: 14,
    color: '#777',
    textAlign: 'center',
    marginBottom: 20,
  },
  addPlanButton: {
    backgroundColor: '#00ff9d',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 16,
    marginTop: 20,
  },
  addPlanButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },
  floatingButton: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#00ff9d',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  // Skeleton Loading Styles
  skeletonCard: {
    backgroundColor: '#1a1a1a',
    borderColor: '#1a1a1a',
  },
  skeletonText: {
    backgroundColor: '#1a1a1a',
    borderRadius: 4,
  },
});

export default WorkoutPlan;