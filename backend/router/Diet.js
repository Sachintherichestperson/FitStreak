const express = require('express');
const router = express.Router();
const Dietmongo = require('../models/Dietmongo');
const isloggedin = require('../middleware/isloggein');
const usermongo = require('../models/User-mongo');

router.get("/today", isloggedin, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get today's day name - FIXED THE ERROR HERE
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const todayIndex = new Date().getDay(); // 0 = Sunday, 1 = Monday, etc.
    const todayLower = days[todayIndex];

    console.log(`Fetching diet for user ${userId}, today is: ${todayLower}`);

    // Find user's diet plan
    const diet = await Dietmongo.findOne({ userId: userId });

    if (!diet) {
      console.log('No diet plan found for user:', userId);
      return res.status(200).json({ 
        success: true, 
        message: "No diet plan found",
        hasPlan: false 
      });
    }

    let todayData;
    
    if (diet.isSameForAllDays) {
      todayData = diet.days.monday;
    } else {
      todayData = diet.days[todayLower];
    }

    if (!todayData) {
      console.log(`No data found for ${todayLower}`);
      return res.status(200).json({ 
        success: true, 
        message: `No diet data found for ${todayLower}`,
        hasPlan: false 
      });
    }

    if (!todayData.enabled) {
      return res.status(200).json({ 
        success: true, 
        message: "Today is disabled in your diet plan",
        hasPlan: false 
      });
    }

    const enabledMeals = todayData.meals.filter(meal => meal.enabled);
    
    if (enabledMeals.length === 0) {
      return res.status(200).json({ 
        success: true, 
        message: "No meals enabled for today",
        hasPlan: false 
      });
    }

    
    const response = {
      success: true,
      hasPlan: true,
      Target: diet.kcalGoal,
      day: todayData.day,
      totalCalories: todayData.totalCalories,
      totalProtein: todayData.totalProtein || 0,
      totalCarbs: todayData.totalCarbs || 0, 
      totalFat: todayData.totalFat || 0,
      meals: enabledMeals.map(meal => ({
        id: meal.id,
        name: meal.name,
        time: meal.time,
        isCustom: meal.isCustom,
        totalCalories: meal.totalCalories,
        totalProtein: meal.totalProtein,
        totalCarbs: meal.totalCarbs,
        totalFat: meal.totalFat,
        foods: meal.foods.map(food => ({
          id: food._id ? food._id.toString() : food.id || `food-${Date.now()}`,
          name: food.name,
          portion: food.portion,
          calories: food.calories,
          protein: food.protein,
          carbs: food.carbs,
          fat: food.fat
        }))
      }))
    };

    res.status(200).json(response);

  } catch (error) {
    console.error("Error fetching today's diet:", error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ success: false, error: "Invalid token" });
    }
    
    res.status(500).json({ success: false, error: "Server error" });
  }
});

async function calculateTodaysProgress(userId, day) {
  try {
    return {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0
    };
  } catch (error) {
    console.error("Error calculating progress:", error);
    return { calories: 0, protein: 0, carbs: 0, fat: 0 };
  }
}

router.get("/get-diet", isloggedin, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const diet = await Dietmongo.findOne({ userId: userId });
    console.log(diet);
    
    if (!diet) {
      return res.status(404).json({ 
        success: false, 
        message: "No diet plan found" 
      });
    }

    res.status(200).json({ 
      success: true, 
      diet 
    });

  } catch (error) {
    console.error("Error fetching diet plan:", error);
    res.status(500).json({ success: false, error: "Server error" });
  }
});

router.post("/setup", isloggedin, async (req, res) => {
  try {
    console.log("Received diet data:", JSON.stringify(req.body, null, 2));
    const { kcalGoal, isSameForAllDays, days } = req.body;
    
    const userId = req.user.id;

    if (!userId || !kcalGoal) {
      return res.status(400).json({ success: false, error: "UserId and calorie goal required" });
    }

    // Validate required days
    const requiredDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    for (const day of requiredDays) {
      if (!days[day]) {
        return res.status(400).json({ success: false, error: `Missing data for ${day}` });
      }
    }

    let diet = await Dietmongo.findOne({ userId: userId });
    const user = await usermongo.findById(userId);

    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    // Process and validate the incoming data
    const processedDays = {};
    
    requiredDays.forEach(dayId => {
      const dayData = days[dayId];
      if (dayData) {
        // Initialize day totals
        let dayTotalCalories = 0;
        let dayTotalProtein = 0;
        let dayTotalCarbs = 0;
        let dayTotalFat = 0;

        // Process each meal
        const processedMeals = dayData.meals.map(meal => {
          if (meal.enabled) {
            // Initialize meal totals
            let mealTotalCalories = 0;
            let mealTotalProtein = 0;
            let mealTotalCarbs = 0;
            let mealTotalFat = 0;

            // Process each food item and calculate meal totals
            const processedFoods = meal.foods.map(food => {
              const foodCalories = Number(food.calories) || 0;
              const foodProtein = Number(food.protein) || 0;
              const foodCarbs = Number(food.carbs) || 0;
              const foodFat = Number(food.fat) || 0;

              // Add to meal totals
              mealTotalCalories += foodCalories;
              mealTotalProtein += foodProtein;
              mealTotalCarbs += foodCarbs;
              mealTotalFat += foodFat;

              return {
                name: food.name || '',
                portion: food.portion || '1 serving',
                calories: foodCalories,
                protein: foodProtein,
                carbs: foodCarbs,
                fat: foodFat
              };
            });

            // Add to day totals
            dayTotalCalories += mealTotalCalories;
            dayTotalProtein += mealTotalProtein;
            dayTotalCarbs += mealTotalCarbs;
            dayTotalFat += mealTotalFat;

            return {
              id: meal.id,
              name: meal.name,
              time: meal.time,
              isCustom: meal.isCustom || false,
              enabled: meal.enabled,
              foods: processedFoods,
              totalCalories: mealTotalCalories,
              totalProtein: mealTotalProtein,
              totalCarbs: mealTotalCarbs,
              totalFat: mealTotalFat
            };
          }
          return meal; // Return disabled meals as-is
        });

        processedDays[dayId] = {
          day: dayData.day,
          enabled: dayData.enabled,
          meals: processedMeals,
          totalCalories: dayTotalCalories,
          totalProtein: dayTotalProtein,
          totalCarbs: dayTotalCarbs,
          totalFat: dayTotalFat
        };
      }
    });

    if (diet) {
      // Update existing diet
      diet.kcalGoal = kcalGoal;
      diet.isSameForAllDays = isSameForAllDays;
      diet.days = processedDays;
      diet.updatedAt = new Date();
    } else {
      // Create new diet
      diet = new Dietmongo({
        userId: userId,
        kcalGoal: kcalGoal,
        isSameForAllDays: isSameForAllDays,
        days: processedDays
      });
    }

    await diet.save();

    // Add diet reference to user if not already present
    if (!user.Diet.map(id => id.toString()).includes(diet._id.toString())) {
      user.Diet.push(diet._id);
      await user.save();
    }

    res.status(200).json({ 
      success: true, 
      message: "Diet plan saved successfully",
      dietId: diet._id 
    });

  } catch (error) {
    console.error("Error saving diet plan:", error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ success: false, error: "Invalid token" });
    }
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({ success: false, error: error.message });
    }
    
    res.status(500).json({ success: false, error: "Server error" });
  }
});

function getMealTime(mealType) {
  switch(mealType) {
    case 'breakfast': return '8:00 AM';
    case 'lunch': return '1:00 PM';
    case 'evening': return '4:00 PM';
    case 'dinner': return '7:00 PM';
    default: return '12:00 PM';
  }
}

router.post("/mark-followed", isloggedin, async (req, res) => {
  console.log(req.body);
});

module.exports = router;
