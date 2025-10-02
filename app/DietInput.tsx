import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

// Constants
const DEFAULT_MEAL_TYPES = [
  { id: 'breakfast', name: 'Breakfast', time: '08:00', isCustom: false },
  { id: 'lunch', name: 'Lunch', time: '13:00', isCustom: false },
  { id: 'dinner', name: 'Dinner', time: '20:00', isCustom: false }
];

const API_BASE_URL = 'http://192.168.29.104:3000/Diet';

// Helper functions
const createInitialDietPlan = () => {
  return {
    day: 'Daily Diet',
    meals: DEFAULT_MEAL_TYPES.map(meal => ({
      ...meal,
      foods: [],
      totalCalories: 0,
      totalProtein: 0,
      totalCarbs: 0,
      totalFat: 0,
      enabled: true
    })),
    totalCalories: 0,
    totalProtein: 0,
    totalCarbs: 0,
    totalFat: 0,
    enabled: true
  };
};

const validateTimeFormat = (time) => {
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(time);
};

const DietSetup = () => {
  const router = useRouter();
  
  const [kcalGoal, setKcalGoal] = useState('');
  const [dietPlan, setDietPlan] = useState(createInitialDietPlan());
  const [showAddFoodModal, setShowAddFoodModal] = useState(false);
  const [showAddMealModal, setShowAddMealModal] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState('breakfast');
  const [newFood, setNewFood] = useState({
    name: '',
    calories: '',
    protein: '',
    carbs: '',
    fat: '',
    portion: '1 serving'
  });
  const [newMeal, setNewMeal] = useState({
    name: '',
    time: ''
  });
  const [isLoading, setIsLoading] = useState(true);
  const [hasExistingDiet, setHasExistingDiet] = useState(false);

  // Initialize diet plan on component mount
  useEffect(() => {
    fetchExistingDiet();
  }, []);

  const fetchExistingDiet = async () => {
    try {
      const token = await AsyncStorage.getItem('Token');
      if (!token) {
        setIsLoading(false);
        return;
      }

      const response = await fetch(`${API_BASE_URL}/get-diet`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.success && data.diet) {
          setHasExistingDiet(true);
          setKcalGoal(data.diet.kcalGoal?.toString() || '');
          
          // Safely merge existing diet with default structure
          if (data.diet.days && data.diet.days.monday) {
            const existingDay = data.diet.days.monday;
            const mergedDietPlan = {
              day: 'Daily Diet',
              enabled: existingDay.enabled ?? true,
              totalCalories: existingDay.totalCalories || 0,
              totalProtein: existingDay.totalProtein || 0,
              totalCarbs: existingDay.totalCarbs || 0,
              totalFat: existingDay.totalFat || 0,
              meals: existingDay.meals?.map(existingMeal => {
                const defaultMeal = DEFAULT_MEAL_TYPES.find(m => m.id === existingMeal.id);
                return {
                  ...(defaultMeal || {
                    id: existingMeal.id,
                    name: existingMeal.name,
                    time: existingMeal.time || '08:00',
                    isCustom: true
                  }),
                  ...existingMeal,
                  foods: existingMeal.foods || [],
                  totalCalories: existingMeal.totalCalories || 0,
                  totalProtein: existingMeal.totalProtein || 0,
                  totalCarbs: existingMeal.totalCarbs || 0,
                  totalFat: existingMeal.totalFat || 0,
                  enabled: existingMeal.enabled ?? true
                };
              }) || createInitialDietPlan().meals
            };
            setDietPlan(mergedDietPlan);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching diet:', error);
      Alert.alert('Error', 'Failed to load diet data');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleDayEnabled = () => {
    setDietPlan(prev => ({
      ...prev,
      enabled: !prev.enabled
    }));
  };

  const toggleMealEnabled = (mealId) => {
    setDietPlan(prev => ({
      ...prev,
      meals: prev.meals.map(meal =>
        meal.id === mealId ? { ...meal, enabled: !meal.enabled } : meal
      )
    }));
  };

  const updateMealTime = (mealId, time) => {
    if (!validateTimeFormat(time) && time !== '') {
      Alert.alert('Invalid Time', 'Please enter time in HH:MM format');
      return;
    }

    setDietPlan(prev => ({
      ...prev,
      meals: prev.meals.map(meal =>
        meal.id === mealId ? { ...meal, time } : meal
      )
    }));
  };

  const addCustomMeal = () => {
    if (!newMeal.name.trim()) {
      Alert.alert('Error', 'Please enter a meal name');
      return;
    }

    if (!newMeal.time.trim() || !validateTimeFormat(newMeal.time)) {
      Alert.alert('Error', 'Please enter a valid time in HH:MM format');
      return;
    }

    const customMeal = {
      id: `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: newMeal.name.trim(),
      time: newMeal.time.trim(),
      isCustom: true,
      foods: [],
      totalCalories: 0,
      totalProtein: 0,
      totalCarbs: 0,
      totalFat: 0,
      enabled: true
    };

    setDietPlan(prev => ({
      ...prev,
      meals: [...prev.meals, customMeal]
    }));

    setNewMeal({ name: '', time: '' });
    setShowAddMealModal(false);
  };

  const removeCustomMeal = (mealId) => {
    Alert.alert(
      'Remove Meal',
      'Are you sure you want to remove this meal?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove', 
          style: 'destructive',
          onPress: () => {
            setDietPlan(prev => ({
              ...prev,
              meals: prev.meals.filter(meal => meal.id !== mealId)
            }));
          }
        }
      ]
    );
  };

  const addFoodToMeal = () => {
    // Validation
    if (!newFood.name.trim()) {
      Alert.alert('Error', 'Please enter a food name');
      return;
    }

    const calories = parseInt(newFood.calories) || 0;
    const protein = parseInt(newFood.protein) || 0;
    const carbs = parseInt(newFood.carbs) || 0;
    const fat = parseInt(newFood.fat) || 0;

    // Create food item with ALL nutritional data
    const foodItem = {
      id: `food-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: newFood.name.trim(),
      calories: calories,
      protein: protein,
      carbs: carbs,
      fat: fat,
      portion: newFood.portion.trim() || '1 serving'
    };

    setDietPlan(prev => {
      const mealIndex = prev.meals.findIndex(meal => meal.id === selectedMeal);
      
      if (mealIndex === -1) return prev;

      const updatedMeals = [...prev.meals];
      const targetMeal = { ...updatedMeals[mealIndex] };
      
      // Add food to meal
      targetMeal.foods = [...targetMeal.foods, foodItem];
      
      // Update meal totals - ensure all values are numbers
      targetMeal.totalCalories = (targetMeal.totalCalories || 0) + calories;
      targetMeal.totalProtein = (targetMeal.totalProtein || 0) + protein;
      targetMeal.totalCarbs = (targetMeal.totalCarbs || 0) + carbs;
      targetMeal.totalFat = (targetMeal.totalFat || 0) + fat;
      
      updatedMeals[mealIndex] = targetMeal;
      
      // Update day total
      return {
        ...prev,
        meals: updatedMeals,
        totalCalories: (prev.totalCalories || 0) + calories,
        totalProtein: (prev.totalProtein || 0) + protein,
        totalCarbs: (prev.totalCarbs || 0) + carbs,
        totalFat: (prev.totalFat || 0) + fat
      };
    });

    // Reset form and close modal
    setNewFood({
      name: '',
      calories: '',
      protein: '',
      carbs: '',
      fat: '',
      portion: '1 serving'
    });
    setShowAddFoodModal(false);
  };

  const removeFoodFromMeal = (mealId, foodId) => {
    Alert.alert(
      'Remove Food',
      'Are you sure you want to remove this food?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove', 
          style: 'destructive',
          onPress: () => {
            setDietPlan(prev => {
              const mealIndex = prev.meals.findIndex(meal => meal.id === mealId);
              
              if (mealIndex === -1) return prev;

              const updatedMeals = [...prev.meals];
              const targetMeal = { ...updatedMeals[mealIndex] };
              
              const foodIndex = targetMeal.foods.findIndex(food => food.id === foodId);
              
              if (foodIndex === -1) return prev;

              const foodItem = targetMeal.foods[foodIndex];
              
              // Subtract from totals
              targetMeal.totalCalories -= foodItem.calories;
              targetMeal.totalProtein -= foodItem.protein;
              targetMeal.totalCarbs -= foodItem.carbs;
              targetMeal.totalFat -= foodItem.fat;
              
              // Remove food
              targetMeal.foods = targetMeal.foods.filter(food => food.id !== foodId);
              
              updatedMeals[mealIndex] = targetMeal;
              
              // Update day total
              return {
                ...prev,
                meals: updatedMeals,
                totalCalories: Math.max(0, prev.totalCalories - foodItem.calories),
                totalProtein: Math.max(0, prev.totalProtein - foodItem.protein),
                totalCarbs: Math.max(0, prev.totalCarbs - foodItem.carbs),
                totalFat: Math.max(0, prev.totalFat - foodItem.fat)
              };
            });
          }
        }
      ]
    );
  };

  const saveDietPlan = async () => {
    try {
      const kcalValue = parseInt(kcalGoal);
      if (isNaN(kcalValue) || kcalValue <= 0) {
        Alert.alert('Error', 'Please enter a valid calorie goal');
        return;
      }

      const token = await AsyncStorage.getItem('Token');
      if (!token) {
        Alert.alert('Error', 'Please login again');
        router.push('/Login');
        return;
      }

      // Create a clean plan with all necessary data
      const planToSave = {
        kcalGoal: kcalValue,
        days: {
          monday: dietPlan,
          tuesday: dietPlan,
          wednesday: dietPlan,
          thursday: dietPlan,
          friday: dietPlan,
          saturday: dietPlan,
          sunday: dietPlan
        },
        updatedAt: new Date().toISOString()
      };

      console.log('Sending diet plan:', JSON.stringify(planToSave, null, 2)); // For debugging

      const response = await fetch(`${API_BASE_URL}/setup`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(planToSave)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to save diet plan');
      }

      if (data.success) {
        Alert.alert(
          'Success', 
          hasExistingDiet ? 'Diet plan updated successfully!' : 'Diet plan saved successfully!', 
          [{ text: 'OK', onPress: () => router.back() }]
        );
      } else {
        Alert.alert('Error', data.message || 'Failed to save diet plan');
      }
    } catch (error) {
      console.error('Error saving diet plan:', error);
      Alert.alert('Error', error.message || 'Failed to save diet plan. Please try again.');
    }
  };

  // Component rendering functions
  const MealTimeInput = ({ meal }) => (
    <View style={styles.mealTimeContainer}>
      <Text style={styles.mealTimeLabel}>Time:</Text>
      <TextInput
        style={styles.timeInput}
        value={meal.time}
        onChangeText={(text) => updateMealTime(meal.id, text)}
        placeholder="HH:MM"
        placeholderTextColor="#666"
        keyboardType="numbers-and-punctuation"
        maxLength={5}
      />
    </View>
  );

  const FoodItem = ({ mealId, food }) => (
    <View style={styles.foodItem}>
      <View style={styles.foodInfo}>
        <Text style={styles.foodName}>{food.name}</Text>
        <Text style={styles.foodPortion}>{food.portion}</Text>
      </View>
      
      <View style={styles.foodNutrition}>
        <Text style={styles.foodCalories}>{food.calories} kcal</Text>
        <View style={styles.macroPills}>
          <View style={styles.macroPill}>
            <Text style={styles.macroText}>P: {food.protein}g</Text>
          </View>
          <View style={styles.macroPill}>
            <Text style={styles.macroText}>C: {food.carbs}g</Text>
          </View>
          <View style={styles.macroPill}>
            <Text style={styles.macroText}>F: {food.fat}g</Text>
          </View>
        </View>
      </View>
      
      <TouchableOpacity 
        style={styles.removeFoodButton}
        onPress={() => removeFoodFromMeal(mealId, food.id)}
      >
        <Ionicons name="trash-outline" size={16} color="#ff4444" />
      </TouchableOpacity>
    </View>
  );

  const MealCard = ({ meal }) => (
    <View style={[
      styles.mealCard,
      !meal.enabled && styles.mealCardDisabled
    ]}>
      <View style={styles.mealHeader}>
        <View style={styles.mealInfo}>
          <View style={styles.mealTitleRow}>
            <Text style={styles.mealName}>{meal.name}</Text>
            {meal.isCustom && (
              <TouchableOpacity 
                style={styles.removeMealButton}
                onPress={() => removeCustomMeal(meal.id)}
              >
                <Ionicons name="close-circle" size={16} color="#ff4444" />
              </TouchableOpacity>
            )}
          </View>
          <MealTimeInput meal={meal} />
        </View>
        
        <View style={styles.mealControls}>
          <Text style={styles.mealTotal}>{meal.totalCalories} kcal</Text>
          <Switch
            value={meal.enabled}
            onValueChange={() => toggleMealEnabled(meal.id)}
            trackColor={{ false: '#767577', true: '#00f5ff' }}
            thumbColor={meal.enabled ? '#00ff9d' : '#f4f3f4'}
          />
        </View>
      </View>

      {meal.enabled && (
        <View style={styles.foodsList}>
          {meal.foods.map(food => (
            <FoodItem 
              key={food.id} 
              mealId={meal.id}
              food={food} 
            />
          ))}
          
          <TouchableOpacity 
            style={styles.addFoodButton}
            onPress={() => {
              setSelectedMeal(meal.id);
              setShowAddFoodModal(true);
            }}
          >
            <Ionicons name="add" size={18} color="#00f5ff" />
            <Text style={styles.addFoodText}>Add Food</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['#0a0a0a', '#121212']}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00f5ff" />
          <Text style={styles.loadingText}>Loading your diet plan...</Text>
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
        <Text style={styles.headerTitle}>
          {hasExistingDiet ? 'Edit Diet Plan' : 'Setup Diet Plan'}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Calorie Goal Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {hasExistingDiet ? 'Update Calorie Goal' : 'Daily Calorie Goal'}
          </Text>
          <View style={styles.kcalInputContainer}>
            <TextInput
              style={styles.kcalInput}
              value={kcalGoal}
              onChangeText={setKcalGoal}
              placeholder="Enter your daily calorie target"
              placeholderTextColor="#666"
              keyboardType="numeric"
            />
            <Text style={styles.kcalLabel}>kcal/day</Text>
          </View>
        </View>

        {/* Daily Diet Plan */}
        <View style={styles.section}>
          <View style={styles.dayHeader}>
            <View style={styles.dayTitleContainer}>
              <Text style={styles.dayTitle}>Daily Diet Plan</Text>
              <Text style={styles.dayCalories}>
                Total: {dietPlan.totalCalories} kcal
              </Text>
              <Text style={styles.dayMacros}>
                P: {dietPlan.totalProtein}g | C: {dietPlan.totalCarbs}g | F: {dietPlan.totalFat}g
              </Text>
            </View>
            <Switch
              value={dietPlan.enabled}
              onValueChange={toggleDayEnabled}
              trackColor={{ false: '#767577', true: '#00f5ff' }}
              thumbColor={dietPlan.enabled ? '#00ff9d' : '#f4f3f4'}
            />
          </View>

          {dietPlan.enabled && (
            <View style={styles.mealsContainer}>
              {dietPlan.meals.map(meal => (
                <MealCard key={meal.id} meal={meal} />
              ))}
              
              <TouchableOpacity 
                style={styles.addMealCard}
                onPress={() => setShowAddMealModal(true)}
              >
                <Ionicons name="add-circle-outline" size={24} color="#00f5ff" />
                <Text style={styles.addMealCardText}>Add Another Meal</Text>
                <Text style={styles.addMealCardSubtext}>Snacks, Brunch, Pre-workout, etc.</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Save Button */}
        <TouchableOpacity style={styles.saveButton} onPress={saveDietPlan}>
          <LinearGradient
            colors={['#00f5ff', '#00ff9d']}
            style={styles.saveButtonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={styles.saveButtonText}>
              {hasExistingDiet ? 'Update Diet Plan' : 'Save Diet Plan'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>

      {/* Add Food Modal */}
      <Modal
        visible={showAddFoodModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddFoodModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Food</Text>
            
            <ScrollView style={styles.modalScroll}>
              <View style={styles.modalInputGroup}>
                <Text style={styles.modalLabel}>Food Name *</Text>
                <TextInput
                  style={styles.modalInput}
                  value={newFood.name}
                  onChangeText={(text) => setNewFood(prev => ({ ...prev, name: text }))}
                  placeholder="e.g., Chicken Breast, Rice, Apple"
                  placeholderTextColor="#666"
                />
              </View>

              <View style={styles.modalInputGroup}>
                <Text style={styles.modalLabel}>Portion Size</Text>
                <TextInput
                  style={styles.modalInput}
                  value={newFood.portion}
                  onChangeText={(text) => setNewFood(prev => ({ ...prev, portion: text }))}
                  placeholder="e.g., 100g, 1 cup, 1 piece"
                  placeholderTextColor="#666"
                />
              </View>

              <View style={styles.nutritionRow}>
                <View style={styles.nutritionInput}>
                  <Text style={styles.modalLabel}>Calories *</Text>
                  <TextInput
                    style={styles.modalInput}
                    value={newFood.calories}
                    onChangeText={(text) => setNewFood(prev => ({ ...prev, calories: text }))}
                    placeholder="0"
                    placeholderTextColor="#666"
                    keyboardType="numeric"
                  />
                </View>
                <View style={styles.nutritionInput}>
                  <Text style={styles.modalLabel}>Protein (g) *</Text>
                  <TextInput
                    style={styles.modalInput}
                    value={newFood.protein}
                    onChangeText={(text) => setNewFood(prev => ({ ...prev, protein: text }))}
                    placeholder="0"
                    placeholderTextColor="#666"
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <View style={styles.nutritionRow}>
                <View style={styles.nutritionInput}>
                  <Text style={styles.modalLabel}>Carbs (g) *</Text>
                  <TextInput
                    style={styles.modalInput}
                    value={newFood.carbs}
                    onChangeText={(text) => setNewFood(prev => ({ ...prev, carbs: text }))}
                    placeholder="0"
                    placeholderTextColor="#666"
                    keyboardType="numeric"
                  />
                </View>
                <View style={styles.nutritionInput}>
                  <Text style={styles.modalLabel}>Fat (g) *</Text>
                  <TextInput
                    style={styles.modalInput}
                    value={newFood.fat}
                    onChangeText={(text) => setNewFood(prev => ({ ...prev, fat: text }))}
                    placeholder="0"
                    placeholderTextColor="#666"
                    keyboardType="numeric"
                  />
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowAddFoodModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.addButton]}
                onPress={addFoodToMeal}
              >
                <Text style={styles.addButtonText}>Add Food</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add Meal Modal */}
      <Modal
        visible={showAddMealModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddMealModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Custom Meal</Text>
            
            <View style={styles.modalInputGroup}>
              <Text style={styles.modalLabel}>Meal Name *</Text>
              <TextInput
                style={styles.modalInput}
                value={newMeal.name}
                onChangeText={(text) => setNewMeal(prev => ({ ...prev, name: text }))}
                placeholder="e.g., Snack, Brunch, Pre-workout"
                placeholderTextColor="#666"
              />
            </View>

            <View style={styles.modalInputGroup}>
              <Text style={styles.modalLabel}>Meal Time *</Text>
              <TextInput
                style={styles.modalInput}
                value={newMeal.time}
                onChangeText={(text) => setNewMeal(prev => ({ ...prev, time: text }))}
                placeholder="e.g., 10:30, 15:00, 18:30"
                placeholderTextColor="#666"
                keyboardType="numbers-and-punctuation"
                maxLength={5}
              />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowAddMealModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.addButton]}
                onPress={addCustomMeal}
              >
                <Text style={styles.addButtonText}>Add Meal</Text>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#ffffff',
    marginTop: 16,
    fontSize: 16,
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
  headerSpacer: {
    width: 40,
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
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 10,
  },
  kcalInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#121212',
    borderRadius: 12,
    padding: 15,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  kcalInput: {
    flex: 1,
    fontSize: 16,
    color: '#ffffff',
  },
  kcalLabel: {
    fontSize: 14,
    color: '#777',
    marginLeft: 10,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#121212',
    borderRadius: 12,
    padding: 15,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    marginBottom: 15,
  },
  dayTitleContainer: {
    flex: 1,
  },
  dayTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
  },
  dayCalories: {
    fontSize: 12,
    color: '#00f5ff',
    marginBottom: 2,
  },
  dayMacros: {
    fontSize: 11,
    color: '#777',
  },
  mealsContainer: {
    gap: 12,
  },
  mealCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 8,
    padding: 12,
  },
  mealCardDisabled: {
    opacity: 0.6,
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  mealInfo: {
    flex: 1,
  },
  mealTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  mealName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
    marginRight: 8,
  },
  removeMealButton: {
    padding: 2,
  },
  mealControls: {
    alignItems: 'flex-end',
    gap: 4,
  },
  mealTotal: {
    fontSize: 12,
    color: '#00ff9d',
    fontWeight: '500',
  },
  mealTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mealTimeLabel: {
    fontSize: 12,
    color: '#777',
    marginRight: 8,
  },
  timeInput: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 4,
    padding: 4,
    color: '#ffffff',
    fontSize: 12,
    minWidth: 60,
  },
  foodsList: {
    gap: 8,
  },
  foodItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 6,
    padding: 8,
  },
  foodInfo: {
    flex: 1,
    marginRight: 10,
  },
  foodName: {
    fontSize: 12,
    color: '#ffffff',
    marginBottom: 2,
  },
  foodPortion: {
    fontSize: 10,
    color: '#777',
  },
  foodNutrition: {
    alignItems: 'flex-end',
    marginRight: 10,
  },
  foodCalories: {
    fontSize: 11,
    color: '#00f5ff',
    marginBottom: 4,
    fontWeight: '500',
  },
  macroPills: {
    flexDirection: 'row',
    gap: 4,
  },
  macroPill: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  macroText: {
    fontSize: 8,
    color: '#777',
  },
  removeFoodButton: {
    padding: 4,
  },
  addFoodButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    backgroundColor: 'rgba(0,245,255,0.08)',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(0,245,255,0.2)',
  },
  addFoodText: {
    color: '#00f5ff',
    marginLeft: 6,
    fontSize: 12,
    fontWeight: '500',
  },
  addMealCard: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: 'rgba(0,245,255,0.05)',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'rgba(0,245,255,0.2)',
    borderStyle: 'dashed',
  },
  addMealCardText: {
    color: '#00f5ff',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
    marginBottom: 4,
  },
  addMealCardSubtext: {
    color: '#777',
    fontSize: 11,
    textAlign: 'center',
  },
  saveButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 20,
  },
  saveButtonGradient: {
    paddingVertical: 18,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 25,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  modalScroll: {
    maxHeight: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalInputGroup: {
    marginBottom: 15,
  },
  modalLabel: {
    fontSize: 14,
    color: '#777',
    marginBottom: 8,
  },
  modalInput: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 8,
    padding: 12,
    color: '#ffffff',
    fontSize: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  nutritionRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 15,
  },
  nutritionInput: {
    flex: 1,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  cancelButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
  },
  addButton: {
    backgroundColor: '#00f5ff',
  },
  addButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default DietSetup;