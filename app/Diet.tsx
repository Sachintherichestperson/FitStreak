import { FontAwesome, FontAwesome5, Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    Animated,
    Dimensions,
    FlatList,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

const { width } = Dimensions.get('window');

const DietPlan = () => {
  const router = useRouter();
  const pulseAnim = new Animated.Value(1);
  const [dietPlan, setDietPlan] = useState(null);
  const [completedFoods, setCompletedFoods] = useState({});
  const [Target, SetTarget] = useState(0);
  const [dailyProgress, setDailyProgress] = useState({
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [dietFollowed, setDietFollowed] = useState(false);

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

  // Calculate nutrition progress based on completed foods
  const calculateNutritionProgress = (currentCompletedFoods) => {
    let caloriesConsumed = 0;
    let proteinConsumed = 0;
    let carbsConsumed = 0;
    let fatConsumed = 0;

    // Access meals from dietPlan response
    if (dietPlan?.meals) {
      dietPlan.meals.forEach(meal => {
        if (meal.foods) {
          meal.foods.forEach(food => {
            const foodId = food.id || `${meal.id}-${food.name}`;
            if (currentCompletedFoods[foodId]) {
              caloriesConsumed += food.calories || 0;
              proteinConsumed += food.protein || 0;
              carbsConsumed += food.carbs || 0;
              fatConsumed += food.fat || 0;
            }
          });
        }
      });
    }

    return { 
      calories: Math.round(caloriesConsumed), 
      protein: Math.round(proteinConsumed), 
      carbs: Math.round(carbsConsumed), 
      fat: Math.round(fatConsumed) 
    };
  };

  // Update progress whenever completedFoods changes
  useEffect(() => {
    const newProgress = calculateNutritionProgress(completedFoods);
    setDailyProgress(newProgress);
  }, [completedFoods, dietPlan]);

  useEffect(() => {
    const fetchDietPlanAndState = async () => {
      try {
        setIsLoading(true);
        const token = await AsyncStorage.getItem('Token');
        if (!token) {
          Alert.alert('Error', 'Please login again');
          router.push('/Login');
          return;
        }

        // Fetch diet plan
        const response = await fetch('http://192.168.141.177:3000/Diet/today', {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.message || 'Failed to fetch diet plan');
        }
        
        if (!data.success || !data.hasPlan) {
          setDietPlan(null);
          return;
        }
        
        // Set the diet plan data
        setDietPlan(data);
        SetTarget(data.kcalGoal || data.Target || 2000); // Fallback to 2000 if not provided
        
        // Load saved completed foods from AsyncStorage
        const today = new Date().toISOString().split('T')[0];
        const savedCompletedFoods = await AsyncStorage.getItem(`completedFoods_${today}`);
        
        if (savedCompletedFoods) {
          const parsedCompletedFoods = JSON.parse(savedCompletedFoods);
          setCompletedFoods(parsedCompletedFoods);
          
          // Calculate initial progress from saved completed foods
          const initialProgress = calculateNutritionProgress(parsedCompletedFoods);
          setDailyProgress(initialProgress);
        } else {
          // Initialize completed foods state if no saved data
          const foodsState = {};
          if (data.meals) {
            data.meals.forEach(meal => {
              if (meal.foods) {
                meal.foods.forEach(food => {
                  const foodId = food.id || `${meal.id}-${food.name}`;
                  foodsState[foodId] = false;
                });
              }
            });
          }
          setCompletedFoods(foodsState);
          setDailyProgress({
            calories: 0,
            protein: 0,
            carbs: 0,
            fat: 0
          });
        }
        
        // Load diet followed status
        const savedDietFollowed = await AsyncStorage.getItem(`dietFollowed_${today}`);
        if (savedDietFollowed) {
          setDietFollowed(JSON.parse(savedDietFollowed));
        }
        
      } catch (error) {
        console.error('Error fetching diet plan:', error);
        Alert.alert('Error', error.message || 'Failed to load diet plan');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDietPlanAndState();
  }, []);

  const toggleFoodCompletion = async (foodId) => {
    const newCompletedFoods = {
      ...completedFoods,
      [foodId]: !completedFoods[foodId]
    };
    
    setCompletedFoods(newCompletedFoods);
    
    // Save to AsyncStorage
    try {
      const today = new Date().toISOString().split('T')[0];
      await AsyncStorage.setItem(`completedFoods_${today}`, JSON.stringify(newCompletedFoods));
    } catch (error) {
      console.error('Error saving completed foods:', error);
    }
  };

  const toggleMealCompletion = async (mealId) => {
    if (!dietPlan?.meals) return;
    
    const meal = dietPlan.meals.find(m => m.id === mealId);
    if (!meal?.foods) return;
    
    const newCompletedFoods = { ...completedFoods };
    const allMealFoodsCompleted = meal.foods.every(food => {
      const foodId = food.id || `${mealId}-${food.name}`;
      return newCompletedFoods[foodId];
    });
    
    // Toggle all foods in the meal
    meal.foods.forEach(food => {
      const foodId = food.id || `${mealId}-${food.name}`;
      newCompletedFoods[foodId] = !allMealFoodsCompleted;
    });
    
    setCompletedFoods(newCompletedFoods);
    
    // Save to AsyncStorage
    try {
      const today = new Date().toISOString().split('T')[0];
      await AsyncStorage.setItem(`completedFoods_${today}`, JSON.stringify(newCompletedFoods));
    } catch (error) {
      console.error('Error saving completed foods:', error);
    }
  };

  const markDietAsFollowed = async () => {
    try {
      // Calculate completion percentage
      const totalFoods = Object.keys(completedFoods).length;
      const completedFoodsCount = Object.values(completedFoods).filter(Boolean).length;
      const overallCompletion = totalFoods > 0 ? Math.round((completedFoodsCount / totalFoods) * 100) : 0;

      setDietFollowed(true);
      
      // Save to AsyncStorage
      const today = new Date().toISOString().split('T')[0];
      await AsyncStorage.setItem(`dietFollowed_${today}`, JSON.stringify(true));
      
      Alert.alert('Success', `Diet marked as followed! Completion: ${overallCompletion}%`);
      
    } catch (error) {
      console.error('Error marking diet as followed:', error);
      Alert.alert('Error', 'Failed to mark diet as followed');
    }
  };

  const calculatePercentage = (current, target) => {
    if (target === 0) return 0;
    return Math.min(100, Math.round((current / target) * 100));
  };

  const getProgressColor = (percentage) => {
    if (percentage >= 100) return '#ff4444'; // Red if exceeded
    if (percentage >= 80) return '#ffaa00'; // Orange if close to limit
    return '#00ff9d'; // Green if within limits
  };

  const getMacroGoals = () => {
    // More realistic macro ratios based on standard nutrition guidelines
    const proteinRatio = 0.25; // 25% of calories from protein (reduced from 30%)
    const carbsRatio = 0.50;   // 50% of calories from carbs
    const fatRatio = 0.25;     // 25% of calories from fat (increased from 20%)
    
    // Ensure we have a reasonable target
    const calorieTarget = Target > 0 ? Target : 2000;
    
    return {
      protein: Math.round((calorieTarget * proteinRatio) / 4), // 4 calories per gram
      carbs: Math.round((calorieTarget * carbsRatio) / 4),     // 4 calories per gram
      fat: Math.round((calorieTarget * fatRatio) / 9)          // 9 calories per gram
    };
  };

  const calculateMealCompletion = (meal) => {
    if (!meal.foods || meal.foods.length === 0) return 0;
    const completedCount = meal.foods.filter(food => {
      const foodId = food.id || `${meal.id}-${food.name}`;
      return completedFoods[foodId];
    }).length;
    return Math.round((completedCount / meal.foods.length) * 100);
  };

  const macroGoals = getMacroGoals();

  const renderMeal = ({ item }) => {
    const mealCompletion = calculateMealCompletion(item);
    const isMealFullyCompleted = mealCompletion === 100;

    return (
      <View style={[
        styles.mealCard,
        isMealFullyCompleted && styles.mealCardCompleted
      ]}>
        <View style={styles.mealHeader}>
          <View style={styles.mealInfo}>
            <Text style={styles.mealName}>{item.name}</Text>
            <Text style={styles.mealTime}>{item.time}</Text>
            <View style={styles.mealProgressContainer}>
              <View style={styles.mealProgressBar}>
                <View style={[
                  styles.mealProgressFill,
                  { width: `${mealCompletion}%` }
                ]} />
              </View>
              <Text style={styles.mealProgressText}>{mealCompletion}%</Text>
            </View>
          </View>
          
          <View style={styles.mealStats}>
            <Text style={styles.mealCalories}>{Math.round(item.totalCalories)} kcal</Text>
            <View style={styles.mealMacros}>
              <Text style={styles.macroText}>P: {Math.round(item.totalProtein)}g</Text>
              <Text style={styles.macroText}>C: {Math.round(item.totalCarbs)}g</Text>
              <Text style={styles.macroText}>F: {Math.round(item.totalFat)}g</Text>
            </View>
          </View>
          
          <TouchableOpacity 
            style={styles.checkboxContainer}
            onPress={() => toggleMealCompletion(item.id)}
          >
            <View style={[
              styles.checkbox,
              isMealFullyCompleted && styles.checkboxChecked
            ]}>
              {isMealFullyCompleted && (
                <FontAwesome name="check" size={14} color="#00ff9d" />
              )}
            </View>
          </TouchableOpacity>
        </View>
        
        <View style={styles.foodList}>
          {item.foods && item.foods.map((food, index) => {
            const foodId = food.id || `${item.id}-${food.name}`;
            const isFoodCompleted = completedFoods[foodId];
            
            return (
              <TouchableOpacity 
                key={foodId} 
                style={[
                  styles.foodItem,
                  isFoodCompleted && styles.foodItemCompleted
                ]}
                onPress={() => toggleFoodCompletion(foodId)}
              >
                <View style={styles.foodInfo}>
                  <View style={styles.foodHeader}>
                    <Text style={[
                      styles.foodName,
                      isFoodCompleted && styles.foodNameCompleted
                    ]}>
                      {food.name}
                    </Text>
                    <View style={[
                      styles.foodCheckbox,
                      isFoodCompleted && styles.foodCheckboxChecked
                    ]}>
                      {isFoodCompleted && (
                        <FontAwesome name="check" size={10} color="#00ff9d" />
                      )}
                    </View>
                  </View>
                  <Text style={styles.foodPortion}>{food.portion}</Text>
                </View>
                
                <View style={styles.foodNutrition}>
                  <Text style={[
                    styles.foodCalories,
                    isFoodCompleted && styles.foodCaloriesCompleted
                  ]}>
                    {Math.round(food.calories)} kcal
                  </Text>
                  <View style={styles.foodMacros}>
                    <Text style={styles.foodMacroText}>P: {Math.round(food.protein)}g</Text>
                    <Text style={styles.foodMacroText}>C: {Math.round(food.carbs)}g</Text>
                    <Text style={styles.foodMacroText}>F: {Math.round(food.fat)}g</Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
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
        
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#f0f0f0" />
          </TouchableOpacity>
          <View style={[styles.skeletonText, { width: 120, height: 24 }]} />
          <View style={{ width: 40 }} />
        </View>
        
        <View style={styles.progressContainer}>
          <View style={[styles.skeletonText, { width: '100%', height: 100, borderRadius: 16 }]} />
        </View>
        
        <View style={styles.macrosContainer}>
          {[1, 2, 3].map(i => (
            <View key={i} style={[styles.macroCard, styles.skeletonCard]}>
              <View style={[styles.skeletonText, { width: 60, height: 16, marginBottom: 10 }]} />
              <View style={[styles.skeletonText, { width: 40, height: 20 }]} />
            </View>
          ))}
        </View>
        
        <View style={styles.sectionHeader}>
          <View style={[styles.skeletonText, { width: 100, height: 20 }]} />
        </View>
        
        <FlatList
          data={[1, 2, 3]}
          renderItem={() => (
            <View style={[styles.mealCard, styles.skeletonCard]}>
              <View style={styles.mealHeader}>
                <View>
                  <View style={[styles.skeletonText, { width: 80, height: 16, marginBottom: 5 }]} />
                  <View style={[styles.skeletonText, { width: 60, height: 12 }]} />
                </View>
                <View style={[styles.skeletonText, { width: 24, height: 24, borderRadius: 12 }]} />
              </View>
            </View>
          )}
          keyExtractor={(item) => item.toString()}
          contentContainerStyle={styles.mealsContainer}
        />
      </View>
    );
  }

  if (!dietPlan) {
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
          <Text style={styles.headerTitle}>Today's Diet</Text>
          <TouchableOpacity onPress={() => router.push('/DietInput')}>
            <FontAwesome5 name="plus" size={20} color="#00f5ff" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.emptyState}>
          <FontAwesome5 name="utensils" size={64} color="#444" />
          <Text style={styles.emptyStateTitle}>No Diet Plan Found</Text>
          <Text style={styles.emptyStateText}>
            Set up your diet plan to start tracking your nutrition and progress.
          </Text>
          <TouchableOpacity 
            style={styles.setupButton}
            onPress={() => router.push('/DietInput')}
          >
            <LinearGradient
              colors={['#00f5ff', '#00ff9d']}
              style={styles.setupButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.setupButtonText}>Create Diet Plan</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const caloriePercentage = calculatePercentage(dailyProgress.calories, Target);
  const proteinPercentage = calculatePercentage(dailyProgress.protein, macroGoals.protein);
  const carbsPercentage = calculatePercentage(dailyProgress.carbs, macroGoals.carbs);
  const fatPercentage = calculatePercentage(dailyProgress.fat, macroGoals.fat);

  // Calculate overall diet completion percentage
  const totalFoods = Object.keys(completedFoods).length;
  const completedFoodsCount = Object.values(completedFoods).filter(Boolean).length;
  const overallCompletion = totalFoods > 0 ? Math.round((completedFoodsCount / totalFoods) * 100) : 0;

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
        <Text style={styles.headerTitle}>Today's Diet</Text>
        <TouchableOpacity onPress={() => router.push('/DietInput')}>
          <FontAwesome5 name="edit" size={20} color="#00f5ff" />
        </TouchableOpacity>
      </View>
      
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Diet Followed Button */}
        <TouchableOpacity 
          style={[
            styles.dietFollowedButton,
            dietFollowed && styles.dietFollowedButtonCompleted
          ]}
          onPress={markDietAsFollowed}
          disabled={dietFollowed}
        >
          <LinearGradient
            colors={dietFollowed ? ['#00ff9d', '#00ff9d'] : ['#00f5ff', '#00ff9d']}
            style={styles.dietFollowedButtonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <FontAwesome5 
              name={dietFollowed ? "check-circle" : "clipboard-check"} 
              size={20} 
              color={dietFollowed ? "#000" : "#000"} 
            />
            <Text style={styles.dietFollowedButtonText}>
              {dietFollowed ? 'Diet Followed Today!' : 'Mark Diet as Followed'}
            </Text>
            <Text style={styles.dietCompletionText}>
              {overallCompletion}% Complete
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Calorie Progress */}
        <View style={styles.progressContainer}>
          <Text style={styles.progressTitle}>Nutrition Progress</Text>
          <View style={styles.calorieProgress}>
            <Text style={styles.calorieCount}>{dailyProgress.calories}</Text>
            <Text style={styles.calorieLabel}>calories consumed</Text>
            <Text style={styles.calorieTarget}>Target: {Target} kcal</Text>
          </View>
          
          <View style={styles.progressBarBackground}>
            <LinearGradient
              colors={[getProgressColor(caloriePercentage), '#00ff9d']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[
                styles.progressBarFill, 
                { width: `${Math.min(caloriePercentage, 100)}%` }
              ]}
            />
          </View>
          <Text style={styles.progressPercentage}>{caloriePercentage}%</Text>
        </View>
        
        {/* Macros Overview */}
        <View style={styles.macrosContainer}>
          <View style={styles.macroCard}>
            <FontAwesome5 name="dumbbell" size={16} color="#00f5ff" />
            <Text style={styles.macroLabel}>Protein</Text>
            <Text style={styles.macroValue}>
              {dailyProgress.protein}g
            </Text>
            <Text style={styles.macroGoal}>/ {macroGoals.protein}g</Text>
            <View style={styles.macroProgressBar}>
              <View style={[
                styles.macroProgressFill,
                { 
                  width: `${Math.min(proteinPercentage, 100)}%`,
                  backgroundColor: getProgressColor(proteinPercentage)
                }
              ]} />
            </View>
            <Text style={styles.macroPercentage}>{proteinPercentage}%</Text>
          </View>
          
          <View style={styles.macroCard}>
            <FontAwesome5 name="bread-slice" size={16} color="#00f5ff" />
            <Text style={styles.macroLabel}>Carbs</Text>
            <Text style={styles.macroValue}>
              {dailyProgress.carbs}g
            </Text>
            <Text style={styles.macroGoal}>/ {macroGoals.carbs}g</Text>
            <View style={styles.macroProgressBar}>
              <View style={[
                styles.macroProgressFill,
                { 
                  width: `${Math.min(carbsPercentage, 100)}%`,
                  backgroundColor: getProgressColor(carbsPercentage)
                }
              ]} />
            </View>
            <Text style={styles.macroPercentage}>{carbsPercentage}%</Text>
          </View>
          
          <View style={styles.macroCard}>
            <FontAwesome5 name="oil-can" size={16} color="#00f5ff" />
            <Text style={styles.macroLabel}>Fat</Text>
            <Text style={styles.macroValue}>
              {dailyProgress.fat}g
            </Text>
            <Text style={styles.macroGoal}>/ {macroGoals.fat}g</Text>
            <View style={styles.macroProgressBar}>
              <View style={[
                styles.macroProgressFill,
                { 
                  width: `${Math.min(fatPercentage, 100)}%`,
                  backgroundColor: getProgressColor(fatPercentage)
                }
              ]} />
            </View>
            <Text style={styles.macroPercentage}>{fatPercentage}%</Text>
          </View>
        </View>
        
        {/* Meals List */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Today's Meals</Text>
          <Text style={styles.mealsCount}>{dietPlan.meals?.length || 0} meals</Text>
        </View>
        
        <FlatList
          data={dietPlan.meals || []}
          renderItem={renderMeal}
          keyExtractor={item => item.id}
          scrollEnabled={false}
          contentContainerStyle={styles.mealsContainer}
        />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#f0f0f0',
  },
  scrollContainer: {
    paddingBottom: 40,
  },
  dietFollowedButton: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#00f5ff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  dietFollowedButtonCompleted: {
    shadowColor: '#00ff9d',
  },
  dietFollowedButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  dietFollowedButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    marginLeft: 10,
  },
  dietCompletionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginLeft: 'auto',
    backgroundColor: 'rgba(255,255,255,0.3)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  progressContainer: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginHorizontal: 20,
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  progressTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#f0f0f0',
    marginBottom: 15,
    textAlign: 'center',
  },
  calorieProgress: {
    alignItems: 'center',
    marginBottom: 15,
  },
  calorieCount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#00ff9d',
  },
  calorieLabel: {
    fontSize: 14,
    color: '#888',
    marginTop: 4,
  },
  calorieTarget: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressPercentage: {
    fontSize: 12,
    color: '#888',
    textAlign: 'right',
  },
  macrosContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 20,
    marginBottom: 20,
  },
  macroCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 5,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  macroLabel: {
    fontSize: 12,
    color: '#888',
    marginTop: 8,
    marginBottom: 4,
  },
  macroValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#f0f0f0',
  },
  macroGoal: {
    fontSize: 10,
    color: '#666',
    marginBottom: 8,
  },
  macroProgressBar: {
    width: '100%',
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 4,
  },
  macroProgressFill: {
    height: '100%',
    borderRadius: 2,
  },
  macroPercentage: {
    fontSize: 10,
    color: '#888',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#f0f0f0',
  },
  mealsCount: {
    fontSize: 14,
    color: '#888',
  },
  mealsContainer: {
    paddingHorizontal: 20,
  },
  mealCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  mealCardCompleted: {
    borderColor: 'rgba(0, 255, 157, 0.3)',
    backgroundColor: 'rgba(0, 255, 157, 0.05)',
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  mealInfo: {
    flex: 1,
  },
  mealName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#f0f0f0',
    marginBottom: 4,
  },
  mealTime: {
    fontSize: 12,
    color: '#888',
    marginBottom: 8,
  },
  mealProgressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mealProgressBar: {
    flex: 1,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 2,
    overflow: 'hidden',
    marginRight: 8,
  },
  mealProgressFill: {
    height: '100%',
    backgroundColor: '#00ff9d',
    borderRadius: 2,
  },
  mealProgressText: {
    fontSize: 10,
    color: '#888',
    minWidth: 30,
  },
  mealStats: {
    alignItems: 'flex-end',
    marginRight: 12,
  },
  mealCalories: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#00ff9d',
    marginBottom: 4,
  },
  mealMacros: {
    flexDirection: 'row',
    gap: 6,
  },
  macroText: {
    fontSize: 10,
    color: '#888',
  },
  checkboxContainer: {
    padding: 4,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    borderColor: '#00ff9d',
    backgroundColor: 'rgba(0, 255, 157, 0.1)',
  },
  foodList: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
    paddingTop: 12,
  },
  foodItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 8,
  },
  foodItemCompleted: {
    backgroundColor: 'rgba(0, 255, 157, 0.05)',
  },
  foodInfo: {
    flex: 1,
  },
  foodHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  foodName: {
    fontSize: 14,
    color: '#f0f0f0',
    fontWeight: '500',
  },
  foodNameCompleted: {
    color: '#00ff9d',
    textDecorationLine: 'line-through',
  },
  foodPortion: {
    fontSize: 12,
    color: '#888',
  },
  foodCheckbox: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#444',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  foodCheckboxChecked: {
    borderColor: '#00ff9d',
    backgroundColor: 'rgba(0, 255, 157, 0.2)',
  },
  foodNutrition: {
    alignItems: 'flex-end',
  },
  foodCalories: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#00ff9d',
    marginBottom: 2,
  },
  foodCaloriesCompleted: {
    color: '#00ff9d',
    textDecorationLine: 'line-through',
  },
  foodMacros: {
    flexDirection: 'row',
    gap: 4,
  },
  foodMacroText: {
    fontSize: 10,
    color: '#666',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#f0f0f0',
    marginTop: 20,
    marginBottom: 10,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 30,
  },
  setupButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  setupButtonGradient: {
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 12,
  },
  setupButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },
  skeletonText: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 4,
  },
  skeletonCard: {
    opacity: 0.7,
  },
});

export default DietPlan;