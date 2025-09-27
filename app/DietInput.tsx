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
const DAYS_OF_WEEK = [
  { id: 'monday', name: 'Monday' },
  { id: 'tuesday', name: 'Tuesday' },
  { id: 'wednesday', name: 'Wednesday' },
  { id: 'thursday', name: 'Thursday' },
  { id: 'friday', name: 'Friday' },
  { id: 'saturday', name: 'Saturday' },
  { id: 'sunday', name: 'Sunday' }
];

const DEFAULT_MEAL_TYPES = [
  { id: 'breakfast', name: 'Breakfast', time: '08:00', isCustom: false },
  { id: 'lunch', name: 'Lunch', time: '13:00', isCustom: false },
  { id: 'dinner', name: 'Dinner', time: '20:00', isCustom: false }
];

const API_BASE_URL = 'http://192.168.29.104:3000/Diet';

// Helper functions
const createInitialDietPlan = () => {
  return DAYS_OF_WEEK.reduce((acc, day) => {
    acc[day.id] = {
      day: day.name,
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
      enabled: true
    };
    return acc;
  }, {});
};

const validateTimeFormat = (time) => {
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(time);
};

const DietSetup = () => {
  const router = useRouter();
  
  const [kcalGoal, setKcalGoal] = useState('');
  const [dietPlan, setDietPlan] = useState({});
  const [isSameForAllDays, setIsSameForAllDays] = useState(true);
  const [showAddFoodModal, setShowAddFoodModal] = useState(false);
  const [showAddMealModal, setShowAddMealModal] = useState(false);
  const [selectedDay, setSelectedDay] = useState('monday');
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
    setDietPlan(createInitialDietPlan());
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
          setIsSameForAllDays(data.diet.isSameForAllDays ?? true);
          
          // Safely merge existing diet with default structure
          const mergedDietPlan = createInitialDietPlan();
          
          if (data.diet.days) {
            Object.keys(data.diet.days).forEach(dayId => {
              if (mergedDietPlan[dayId] && data.diet.days[dayId]) {
                const existingDay = data.diet.days[dayId];
                mergedDietPlan[dayId] = {
                  ...mergedDietPlan[dayId],
                  ...existingDay,
                  meals: existingDay.meals?.map(existingMeal => {
                    const defaultMeal = mergedDietPlan[dayId].meals.find(m => m.id === existingMeal.id);
                    return {
                      ...(defaultMeal || {}),
                      ...existingMeal,
                      foods: existingMeal.foods || [],
                      totalCalories: existingMeal.totalCalories || 0,
                      totalProtein: existingMeal.totalProtein || 0,
                      totalCarbs: existingMeal.totalCarbs || 0,
                      totalFat: existingMeal.totalFat || 0,
                      enabled: existingMeal.enabled ?? true
                    };
                  }) || mergedDietPlan[dayId].meals
                };
              }
            });
          }
          
          setDietPlan(mergedDietPlan);
        }
      }
    } catch (error) {
      console.error('Error fetching diet:', error);
      Alert.alert('Error', 'Failed to load diet data');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleDayEnabled = (dayId) => {
    setDietPlan(prev => ({
      ...prev,
      [dayId]: {
        ...prev[dayId],
        enabled: !prev[dayId].enabled
      }
    }));
  };

  const toggleMealEnabled = (dayId, mealId) => {
    setDietPlan(prev => ({
      ...prev,
      [dayId]: {
        ...prev[dayId],
        meals: prev[dayId].meals.map(meal =>
          meal.id === mealId ? { ...meal, enabled: !meal.enabled } : meal
        )
      }
    }));
  };

  const updateMealTime = (dayId, mealId, time) => {
    if (!validateTimeFormat(time) && time !== '') {
      Alert.alert('Invalid Time', 'Please enter time in HH:MM format');
      return;
    }

    setDietPlan(prev => ({
      ...prev,
      [dayId]: {
        ...prev[dayId],
        meals: prev[dayId].meals.map(meal =>
          meal.id === mealId ? { ...meal, time } : meal
        )
      }
    }));
  };

  const addCustomMeal = (dayId) => {
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
      [dayId]: {
        ...prev[dayId],
        meals: [...prev[dayId].meals, customMeal]
      }
    }));

    setNewMeal({ name: '', time: '' });
    setShowAddMealModal(false);
  };

  const removeCustomMeal = (dayId, mealId) => {
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
              [dayId]: {
                ...prev[dayId],
                meals: prev[dayId].meals.filter(meal => meal.id !== mealId)
              }
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

    const calories = parseInt(newFood.calories);
    const protein = parseInt(newFood.protein);
    const carbs = parseInt(newFood.carbs);
    const fat = parseInt(newFood.fat);

    if (isNaN(calories) || calories < 0) {
      Alert.alert('Error', 'Please enter valid calories');
      return;
    }

    if (isNaN(protein) || protein < 0) {
      Alert.alert('Error', 'Please enter valid protein amount');
      return;
    }

    if (isNaN(carbs) || carbs < 0) {
      Alert.alert('Error', 'Please enter valid carbs amount');
      return;
    }

    if (isNaN(fat) || fat < 0) {
      Alert.alert('Error', 'Please enter valid fat amount');
      return;
    }

    const foodItem = {
      id: `food-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: newFood.name.trim(),
      calories,
      protein,
      carbs,
      fat,
      portion: newFood.portion.trim() || '1 serving'
    };

    setDietPlan(prev => {
      const updatedPlan = { ...prev };
      const day = updatedPlan[selectedDay];
      
      if (!day) return prev;

      const mealIndex = day.meals.findIndex(meal => meal.id === selectedMeal);
      
      if (mealIndex === -1) return prev;

      const updatedMeals = [...day.meals];
      const targetMeal = { ...updatedMeals[mealIndex] };
      
      // Add food to meal
      targetMeal.foods = [...targetMeal.foods, foodItem];
      
      // Update meal totals
      targetMeal.totalCalories += foodItem.calories;
      targetMeal.totalProtein += foodItem.protein;
      targetMeal.totalCarbs += foodItem.carbs;
      targetMeal.totalFat += foodItem.fat;
      
      updatedMeals[mealIndex] = targetMeal;
      
      // Update day total
      const updatedDay = {
        ...day,
        meals: updatedMeals,
        totalCalories: day.totalCalories + foodItem.calories
      };

      return {
        ...updatedPlan,
        [selectedDay]: updatedDay
      };
    });

    // Reset form
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

  const removeFoodFromMeal = (dayId, mealId, foodId) => {
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
              const updatedPlan = { ...prev };
              const day = updatedPlan[dayId];
              
              if (!day) return prev;

              const mealIndex = day.meals.findIndex(meal => meal.id === mealId);
              
              if (mealIndex === -1) return prev;

              const updatedMeals = [...day.meals];
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
              const updatedDay = {
                ...day,
                meals: updatedMeals,
                totalCalories: Math.max(0, day.totalCalories - foodItem.calories)
              };

              return {
                ...updatedPlan,
                [dayId]: updatedDay
              };
            });
          }
        }
      ]
    );
  };

  const saveDietPlan = async () => {
    try {
      // Validation
      const kcalValue = parseInt(kcalGoal);
      if (isNaN(kcalValue) || kcalValue <= 0) {
        Alert.alert('Error', 'Please enter a valid calorie goal');
        return;
      }

      // Check if at least one day has meals with food
      const hasMeals = Object.values(dietPlan).some(day => 
        day.enabled && day.meals.some(meal => meal.enabled && meal.foods.length > 0)
      );

      if (!hasMeals) {
        Alert.alert('Error', 'Please add at least one food item to your diet plan');
        return;
      }

      const token = await AsyncStorage.getItem('Token');
      if (!token) {
        Alert.alert('Error', 'Please login again');
        router.push('/Login');
        return;
      }

      const planToSave = {
        kcalGoal: kcalValue,
        isSameForAllDays,
        days: Object.entries(dietPlan).reduce((acc, [dayId, dayData]) => {
          if (dayData.enabled) {
            acc[dayId] = {
              ...dayData,
              meals: dayData.meals.filter(meal => meal.enabled).map(meal => ({
                ...meal,
                foods: meal.foods // Ensure foods array is included
              }))
            };
          }
          return acc;
        }, {}),
        updatedAt: new Date().toISOString()
      };

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
          [
            { text: 'OK', onPress: () => router.back() }
          ]
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
  const MealTimeInput = ({ dayId, meal }) => (
    <View style={styles.mealTimeContainer}>
      <Text style={styles.mealTimeLabel}>Time:</Text>
      <TextInput
        style={styles.timeInput}
        value={meal.time}
        onChangeText={(text) => updateMealTime(dayId, meal.id, text)}
        placeholder="HH:MM"
        placeholderTextColor="#666"
        keyboardType="numbers-and-punctuation"
        maxLength={5}
      />
    </View>
  );

  const FoodItem = ({ dayId, mealId, food }) => (
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
        onPress={() => removeFoodFromMeal(dayId, mealId, food.id)}
      >
        <Ionicons name="trash-outline" size={16} color="#ff4444" />
      </TouchableOpacity>
    </View>
  );

  const MealCard = ({ dayId, meal }) => (
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
                onPress={() => removeCustomMeal(dayId, meal.id)}
              >
                <Ionicons name="close-circle" size={16} color="#ff4444" />
              </TouchableOpacity>
            )}
          </View>
          <MealTimeInput dayId={dayId} meal={meal} />
        </View>
        
        <View style={styles.mealControls}>
          <Text style={styles.mealTotal}>{meal.totalCalories} kcal</Text>
          <Switch
            value={meal.enabled}
            onValueChange={() => toggleMealEnabled(dayId, meal.id)}
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
              dayId={dayId}
              mealId={meal.id}
              food={food} 
            />
          ))}
          
          <TouchableOpacity 
            style={styles.addFoodButton}
            onPress={() => {
              setSelectedDay(dayId);
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

  const DaySection = ({ day }) => {
    const dayData = dietPlan[day.id];
    
    if (!dayData) return null;
    
    return (
      <View style={[
        styles.daySection,
        !dayData.enabled && styles.daySectionDisabled
      ]}>
        <View style={styles.dayHeader}>
          <View style={styles.dayTitleContainer}>
            <Text style={styles.dayTitle}>{day.name}</Text>
            <Text style={styles.dayCalories}>
              Total: {dayData.totalCalories} kcal
            </Text>
          </View>
          <Switch
            value={dayData.enabled}
            onValueChange={() => toggleDayEnabled(day.id)}
            trackColor={{ false: '#767577', true: '#00f5ff' }}
            thumbColor={dayData.enabled ? '#00ff9d' : '#f4f3f4'}
          />
        </View>

        {dayData.enabled && (
          <View style={styles.mealsContainer}>
            {dayData.meals.map(meal => (
              <MealCard key={meal.id} dayId={day.id} meal={meal} />
            ))}
            
            <TouchableOpacity 
              style={styles.addMealCard}
              onPress={() => {
                setSelectedDay(day.id);
                setShowAddMealModal(true);
              }}
            >
              <Ionicons name="add-circle-outline" size={24} color="#00f5ff" />
              <Text style={styles.addMealCardText}>Add Another Meal</Text>
              <Text style={styles.addMealCardSubtext}>Snacks, Brunch, Pre-workout, etc.</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

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

        {/* Schedule Options */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Schedule Options</Text>
          <View style={styles.optionCard}>
            <View style={styles.optionInfo}>
              <Text style={styles.optionTitle}>Same diet for all days</Text>
              <Text style={styles.optionDescription}>
                {isSameForAllDays 
                  ? 'Your diet will be the same for every day' 
                  : 'You can set different diets for each day'
                }
              </Text>
            </View>
            <Switch
              value={isSameForAllDays}
              onValueChange={setIsSameForAllDays}
              trackColor={{ false: '#767577', true: '#00f5ff' }}
              thumbColor={isSameForAllDays ? '#00ff9d' : '#f4f3f4'}
            />
          </View>
        </View>

        {/* Days Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {isSameForAllDays ? 'Your Daily Diet' : 'Weekly Diet Plan'}
          </Text>
          
          {isSameForAllDays ? (
            <DaySection day={DAYS_OF_WEEK[0]} />
          ) : (
            DAYS_OF_WEEK.map(day => (
              <DaySection key={day.id} day={day} />
            ))
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
                onPress={() => addCustomMeal(selectedDay)}
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
  sectionDescription: {
    fontSize: 14,
    color: '#777',
    marginBottom: 15,
    lineHeight: 20,
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
  optionCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#121212',
    borderRadius: 12,
    padding: 15,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  optionInfo: {
    flex: 1,
    marginRight: 15,
  },
  optionTitle: {
    fontSize: 16,
    color: '#ffffff',
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 12,
    color: '#777',
    lineHeight: 16,
  },
  daySection: {
    backgroundColor: '#121212',
    borderRadius: 12,
    padding: 15,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    marginBottom: 15,
  },
  daySectionDisabled: {
    opacity: 0.6,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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