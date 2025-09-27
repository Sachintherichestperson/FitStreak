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
          id: food._id ? food._id.toString() : `food-${Date.now()}`,
          name: food.name,
          portion: food.portion,
          calories: food.calories,
          protein: food.protein,
          carbs: food.carbs,
          fat: food.fat
        }))
      })),
      progress: {
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0
      }
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
    console.log("Hello")
    const userId = req.user.id;
    
    const diet = await Dietmongo.findOne({ userId: userId });
    console.log(diet);
    
    if (!diet) {
      return res.status(404).json({ 
        success: false, 
        message: "No diet plan found" 
      });
    }

    console.log(diet);
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
    const { kcalGoal, isSameForAllDays, days } = req.body;
    
    const userId = req.user.id;

    if (!userId || !kcalGoal) {
      return res.status(400).json({ success: false, error: "UserId and calorie goal required" });
    }

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

    if (diet) {
      diet.kcalGoal = kcalGoal;
      diet.isSameForAllDays = isSameForAllDays;
      diet.days = days;
      diet.updatedAt = new Date();
    } else {
      diet = new Dietmongo({
        userId: userId,
        kcalGoal: kcalGoal,
        isSameForAllDays: isSameForAllDays,
        days: days
      });
    }

    requiredDays.forEach(dayId => {
      const day = diet.days[dayId];
      if (day && day.enabled) {
        day.totalCalories = 0;
        
        day.meals.forEach(meal => {
          if (meal.enabled) {
            meal.totalCalories = 0;
            meal.totalProtein = 0;
            meal.totalCarbs = 0;
            meal.totalFat = 0;
            
            meal.foods.forEach(food => {
              meal.totalCalories += food.calories || 0;
              meal.totalProtein += food.protein || 0;
              meal.totalCarbs += food.carbs || 0;
              meal.totalFat += food.fat || 0;
            });
            
            day.totalCalories += meal.totalCalories;
          }
        });
      }
    });

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
    
    res.status(500).json({ success: false, error: "Server error" });
  }
});

// Helper function to assign meal times
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
