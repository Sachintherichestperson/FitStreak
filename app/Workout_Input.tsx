import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

const WorkoutInput = () => {
  const router = useRouter();
  
  // Define types
  type Exercise = {
    name: string;
    sets: number;
    reps: number;
    weight?: number;
    time?: number;
    notes?: string;
  };
  
  type DayWorkout = {
    day: string;
    title: string;
    exercises: Exercise[];
  };
  
  type WorkoutPlanType = {
    _id: string;
    user: string;
    day: string;
    title: string;
    name: string;
    sets: number;
    reps: number;
    weight?: number;
    notes?: string;
  };
  
  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const [selectedDay, setSelectedDay] = useState('Monday');
  const [workoutTitle, setWorkoutTitle] = useState('');
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [existingWorkouts, setExistingWorkouts] = useState<WorkoutPlanType[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [currentExercise, setCurrentExercise] = useState<Exercise>({
    name: '',
    sets: 3,
    reps: 10,
    weight: undefined,
    time: undefined,
    notes: ''
  });

  // Fetch existing workouts when the component mounts or selected day changes
  useEffect(() => {
    fetchExistingWorkouts();
  }, [selectedDay]);


  const fetchExistingWorkouts = async () => {
  try {
    const token = await AsyncStorage.getItem('Token');
    if (!token) {
      console.log('Authentication token not found');
      return;
    }
    
    const response = await fetch("http://192.168.29.104:3000/Workout/Add/workouts", {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.ok) {
      const workouts = await response.json();
      console.log("Full workouts response:", workouts);
      
      // Extract exercises from the days array for the selected day
      const exercisesForSelectedDay: WorkoutPlanType[] = [];
      
      workouts.forEach((workout: any) => {
        // Find the day that matches our selected day
        const dayData = workout.days.find((day: any) => day.day === selectedDay);
        
        if (dayData) {
          // For each exercise in this day, create a workout object
          dayData.exercises.forEach((exercise: any) => {
            exercisesForSelectedDay.push({
              _id: workout._id, // Using workout ID since exercises don't have their own ID
              user: workout.user,
              day: selectedDay,
              title: dayData.title || workoutTitle,
              name: exercise.name,
              sets: exercise.sets,
              reps: exercise.reps,
              weight: exercise.weight,
              notes: exercise.notes
            });
          });
        }
      });
      
      console.log("Exercises for selected day:", exercisesForSelectedDay);
      setExistingWorkouts(exercisesForSelectedDay);
      
      // Set workout title if there are existing workouts for this day
      if (exercisesForSelectedDay.length > 0 && !workoutTitle) {
        setWorkoutTitle(exercisesForSelectedDay[0].title);
      }
    }
  } catch (error) {
    console.error('Error fetching workouts:', error);
  }
};

  const addExercise = () => {
    if (!currentExercise.name) {
      Alert.alert('Error', 'Please enter an exercise name');
      return;
    }
    
    setExercises([...exercises, currentExercise]);
    setCurrentExercise({
      name: '',
      sets: 3,
      reps: 10,
      weight: undefined,
      time: undefined,
      notes: ''
    });
    setModalVisible(false);
  };

  const removeExercise = (index: number) => {
    const newExercises = [...exercises];
    newExercises.splice(index, 1);
    setExercises(newExercises);
  };

  const removeExistingWorkout = async (id: string) => {
    try {
      const token = await AsyncStorage.getItem('Token');
      if (!token) {
        Alert.alert('Error', 'Authentication token not found');
        return;
      }
      
      const response = await fetch(`http://192.168.29.104:3000/Workout/Add/workouts/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        // Remove from local state
        setExistingWorkouts(existingWorkouts.filter(workout => workout._id !== id));
        Alert.alert('Success', 'Workout removed successfully!');
      } else {
        throw new Error('Failed to remove workout');
      }
    } catch (error) {
      console.error('Error removing workout:', error);
      Alert.alert('Error', 'Failed to remove workout');
    }
  };

  const saveWorkoutPlan = async () => {
    if (!workoutTitle) {
      Alert.alert('Error', 'Please enter a workout title');
      return;
    }
    
    if (exercises.length === 0) {
      Alert.alert('Error', 'Please add at least one exercise');
      return;
    }
    
    try {
      const token = await AsyncStorage.getItem('Token');
      if (!token) {
        Alert.alert('Error', 'Authentication token not found');
        return;
      }
      
      // Send each exercise individually to the backend
      for (const exercise of exercises) {
        const requestBody = {
          newExercise: {
            day: selectedDay,
            title: workoutTitle,
            name: exercise.name,
            sets: exercise.sets,
            reps: exercise.reps,
            weight: exercise.weight || 0,
            notes: exercise.notes || ''
          }
        };
        
        const response = await fetch("http://192.168.29.104:3000/Workout/Add/workouts", {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(requestBody)
        });
        
        if (!response.ok) {
          throw new Error(`Failed to save exercise: ${exercise.name}`);
        }
      }
      
      Alert.alert('Success', 'Workout plan saved successfully!');
      // Refresh existing workouts
      fetchExistingWorkouts();
      // Clear the form
      setExercises([]);
    } catch (error) {
      console.error('Error saving workout plan:', error);
      Alert.alert('Error', 'Failed to save workout plan');
    }
  };

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
        <Text style={styles.headerTitle}>Create Workout Plan</Text>
        <View style={{ width: 40 }} />
      </View>
      
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Day Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Day</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.daysContainer}>
            {daysOfWeek.map(day => (
              <TouchableOpacity
                key={day}
                style={[
                  styles.dayButton,
                  selectedDay === day && styles.dayButtonSelected
                ]}
                onPress={() => setSelectedDay(day)}
              >
                <Text style={[
                  styles.dayButtonText,
                  selectedDay === day && styles.dayButtonTextSelected
                ]}>
                  {day.substring(0, 3)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
        
        {/* Existing Workouts */}
        {existingWorkouts.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Existing Workouts for {selectedDay}</Text>
            <View style={styles.existingWorkoutsList}>
              {existingWorkouts.map((workout, index) => (
                <View key={workout._id} style={styles.existingWorkoutItem}>
                  <View style={styles.existingWorkoutInfo}>
                    <Text style={styles.existingWorkoutTitle}>{workout.title}</Text>
                    <Text style={styles.existingWorkoutName}>{workout.name}</Text>
                    <View style={styles.existingWorkoutDetails}>
                      <Text style={styles.existingWorkoutDetail}>{workout.sets} sets</Text>
                      <Text style={styles.existingWorkoutDetail}>{workout.reps} reps</Text>
                      {workout.weight && workout.weight > 0 && (
                        <Text style={styles.existingWorkoutDetail}>{workout.weight} kg</Text>
                      )}
                    </View>
                    {workout.notes && (
                      <Text style={styles.notes}>{workout.notes}</Text>
                    )}
                  </View>
                  <TouchableOpacity 
                    style={styles.removeButton}
                    onPress={() => removeExistingWorkout(workout._id)}
                  >
                    <Ionicons name="trash-outline" size={18} color="#ff6b6b" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>
        )}
        
        {/* Workout Title */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Workout Title</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Chest Day, Leg Day, etc."
            placeholderTextColor="#777"
            value={workoutTitle}
            onChangeText={setWorkoutTitle}
          />
        </View>
        
        {/* Exercises */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>New Exercises</Text>
            <TouchableOpacity 
              style={styles.addButton}
              onPress={() => setModalVisible(true)}
            >
              <Ionicons name="add" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
          
          {exercises.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="fitness-outline" size={40} color="#777" />
              <Text style={styles.emptyStateText}>No exercises added yet</Text>
              <Text style={styles.emptyStateSubText}>Tap the + button to add exercises</Text>
            </View>
          ) : (
            <View style={styles.exercisesList}>
              {exercises.map((exercise, index) => (
                <View key={index} style={styles.exerciseItem}>
                  <View style={styles.exerciseInfo}>
                    <Text style={styles.exerciseName}>{exercise.name}</Text>
                    <View style={styles.exerciseDetails}>
                      <Text style={styles.exerciseDetail}>{exercise.sets} sets</Text>
                      <Text style={styles.exerciseDetail}>{exercise.reps} reps</Text>
                      {exercise.weight && (
                        <Text style={styles.exerciseDetail}>{exercise.weight} kg</Text>
                      )}
                      {exercise.time && (
                        <Text style={styles.exerciseDetail}>{exercise.time} min</Text>
                      )}
                    </View>
                    {exercise.notes && (
                      <Text style={styles.notes}>{exercise.notes}</Text>
                    )}
                  </View>
                  <TouchableOpacity 
                    style={styles.removeButton}
                    onPress={() => removeExercise(index)}
                  >
                    <Ionicons name="trash-outline" size={18} color="#ff6b6b" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>
        
        {/* Save Button */}
        <TouchableOpacity 
          style={styles.saveButton}
          onPress={saveWorkoutPlan}
        >
          <Text style={styles.saveButtonText}>Save Workout Plan</Text>
        </TouchableOpacity>
      </ScrollView>
      
      {/* Add Exercise Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <LinearGradient
              colors={['#1a1a1a', '#2a2a2a']}
              style={StyleSheet.absoluteFill}
            />
            
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Exercise</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#f0f0f0" />
              </TouchableOpacity>
            </View>
            
            <ScrollView contentContainerStyle={styles.modalBody}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Exercise Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., Bench Press, Squats, etc."
                  placeholderTextColor="#777"
                  value={currentExercise.name}
                  onChangeText={(text) => setCurrentExercise({...currentExercise, name: text})}
                />
              </View>
              
              <View style={styles.row}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Sets</Text>
                  <TextInput
                    style={styles.input}
                    keyboardType="numeric"
                    value={currentExercise.sets.toString()}
                    onChangeText={(text) => setCurrentExercise({...currentExercise, sets: parseInt(text) || 0})}
                  />
                </View>
                
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Reps</Text>
                  <TextInput
                    style={styles.input}
                    keyboardType="numeric"
                    value={currentExercise.reps.toString()}
                    onChangeText={(text) => setCurrentExercise({...currentExercise, reps: parseInt(text) || 0})}
                  />
                </View>
                
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Weight (kg)</Text>
                  <TextInput
                    style={styles.input}
                    keyboardType="numeric"
                    placeholder="Optional"
                    placeholderTextColor="#777"
                    value={currentExercise.weight?.toString() || ''}
                    onChangeText={(text) => setCurrentExercise({...currentExercise, weight: text ? parseInt(text) : undefined})}
                  />
                </View>
              </View>
              
              <View style={styles.row}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Time (min)</Text>
                  <TextInput
                    style={styles.input}
                    keyboardType="numeric"
                    placeholder="Optional"
                    placeholderTextColor="#777"
                    value={currentExercise.time?.toString() || ''}
                    onChangeText={(text) => setCurrentExercise({...currentExercise, time: text ? parseInt(text) : undefined})}
                  />
                </View>
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Notes (Optional)</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  multiline
                  numberOfLines={3}
                  placeholder="Any additional notes about this exercise"
                  placeholderTextColor="#777"
                  value={currentExercise.notes}
                  onChangeText={(text) => setCurrentExercise({...currentExercise, notes: text})}
                />
              </View>
            </ScrollView>
            
            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={styles.addExerciseButton}
                onPress={addExercise}
              >
                <Text style={styles.addExerciseButtonText}>Add Exercise</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    paddingBottom: 40,
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
  section: {
    marginBottom: 25,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
  daysContainer: {
    flexDirection: 'row',
    marginTop: 10,
  },
  dayButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#1a1a1a',
    marginRight: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  dayButtonSelected: {
    backgroundColor: '#00ff9d',
  },
  dayButtonText: {
    color: '#777',
    fontWeight: '500',
  },
  dayButtonTextSelected: {
    color: '#000',
  },
  input: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 15,
    color: '#ffffff',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    marginTop: 8,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  inputGroup: {
    marginBottom: 15,
    flex: 1,
  },
  inputLabel: {
    fontSize: 14,
    color: '#777',
    marginBottom: 5,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#00ff9d',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  emptyStateText: {
    fontSize: 16,
    color: '#ffffff',
    marginTop: 10,
    marginBottom: 5,
  },
  emptyStateSubText: {
    fontSize: 14,
    color: '#777',
    textAlign: 'center',
  },
  exercisesList: {
    gap: 12,
  },
  exerciseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 15,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
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
  removeButton: {
    padding: 5,
  },
  saveButton: {
    backgroundColor: '#00ff9d',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  saveButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },
  // Existing workouts styles
  existingWorkoutsList: {
    gap: 12,
  },
  existingWorkoutItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 15,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  existingWorkoutInfo: {
    flex: 1,
  },
  existingWorkoutTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#00ff9d',
    marginBottom: 3,
  },
  existingWorkoutName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#ffffff',
    marginBottom: 5,
  },
  existingWorkoutDetails: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 5,
  },
  existingWorkoutDetail: {
    fontSize: 12,
    color: '#777',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    height: '80%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
  modalBody: {
    padding: 20,
  },
  modalFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  addExerciseButton: {
    backgroundColor: '#00ff9d',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  addExerciseButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default WorkoutInput;