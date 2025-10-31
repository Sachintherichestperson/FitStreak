const express = require('express');
const router = express.Router();
const Usermongo = require('../models/User-mongo');
const Postmongo = require('../models/post-mongo');
const Challengemongo = require('../models/Challenge-mongo');
const isloggedin = require('../middleware/isloggein');
const Gymmongo = require('../models/Gymmongo');
const UserBadge = require("../functions/UserBadge");
const Streakfunction = require('../functions/Streak');
const Workoutmongo = require("../models/Workoutmongo");
const Dietmongo = require("../models/Dietmongo");

router.get('/', isloggedin, async (req, res) => {
    const user = await Usermongo.findOne({ _id: req.user._id })
        .populate('CurrentBadge')
        .populate('ActiveChallenge.challengeId')
        .populate('ChallengesCompleted.challengeId');
    
    const loggedDates = user.WorkoutLog
        .filter(log => log.scanned)
        .map(log => log.date.toISOString().split('T')[0]);

    const FitCoins = user.FitCoins || 0
    const Status = user.CurrentBadge || "The Ant";
    
    res.json({ 
        user,
        streak: user.Streak.Track,
        loggedDates,
        FitCoins,
        Status
    });
});

router.get('/plan',isloggedin, async (req, res) => {
  try {
    const userId = req.user.id;
    const today = new Date();
    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const todayDayName = dayNames[today.getDay()];

    const workoutPlan = await Workoutmongo.findOne({ user: userId });
    
    let todayWorkout = null;
    if (workoutPlan && workoutPlan.days) {
      todayWorkout = workoutPlan.days.find(day => day.day === todayDayName);
    }

    const dietPlan = await Dietmongo.findOne({ userId: userId });
    
    let todayDiet = null;
    let totalCalories = 0;
    let totalProtein = 0;

    if (dietPlan) {
      const dayField = todayDayName.toLowerCase();
      todayDiet = dietPlan.days[dayField];
      
      if (todayDiet && todayDiet.enabled) {
        totalCalories = todayDiet.totalCalories || 0;
        
        if (todayDiet.meals) {
          todayDiet.meals.forEach(meal => {
            if (meal.enabled) {
              totalProtein += meal.totalProtein || 0;
            }
          });
        }
      }
    }

    const workoutData = todayWorkout ? {
      title: todayWorkout.title,
      exerciseCount: todayWorkout.exercises ? todayWorkout.exercises.length : 0,
      totalTime: calculateWorkoutTime(todayWorkout.exercises),
      targetTime: "6:00 PM"
    } : null;

    const dietData = todayDiet ? {
      description: getDietDescription(totalCalories),
      calories: totalCalories,
      protein: Math.round(totalProtein),
      targetTime: "Track your meals"
    } : null;


    res.json({
      success: true,
      workout: workoutData,
      diet: dietData
    });

  } catch (error) {
    console.error('Error fetching user plan:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching plan data'
    });
  }
});

function calculateWorkoutTime(exercises) {
  if (!exercises) return 0;
  const totalExercises = exercises.length;
  return Math.round(totalExercises * 5);
}

function getDietDescription(calories) {
  if (calories < 1500) return "Low Calorie Meal";
  if (calories < 2000) return "Balanced Meal";
  if (calories < 2500) return "High Protein Meal";
  return "High Calorie Meal";
}

router.get('/Active-Challenges', isloggedin, async (req, res) => {
    try {
        const user = await Usermongo.findById(req.user._id).populate('ActiveChallenge.challengeId');
        if (!user) return res.status(404).json({ error: 'User not found' });

        const today = new Date();

        const countNonSundays = (startDate, endDate) => {
            let count = 0;
            const date = new Date(startDate);
            while (date <= endDate) {
                if (date.getDay() !== 0) count++; // 0 = Sunday
                date.setDate(date.getDate() + 1);
            }
            return count;
        };

        const challenges = user.ActiveChallenge.map(challenge => {
            const startDate = new Date(challenge.startDate);
            const endDate = new Date(challenge.endDate);
            const currentDate = today > endDate ? endDate : today;

            const totalDays = countNonSundays(startDate, endDate);
            const daysPassed = countNonSundays(startDate, currentDate);
            const progress = totalDays > 0 ? (daysPassed / totalDays) * 100 : 0;

            return {
                id: challenge.challengeId.id,
                name: challenge.challengeId.Title,
                description: challenge.challengeId.Description,
                startDate: startDate.toISOString().split('T')[0],
                endDate: endDate.toISOString().split('T')[0],
                task: 7,
                daysPassed,
                totalDays,
                progress: progress.toFixed(2)
            };
        });

        res.json({ challenges });
    } catch (err) {
        console.error("Error fetching challenges:", err);
        res.status(500).json({ error: 'Failed to fetch challenges' });
    }
});

router.post("/save-push-token", isloggedin, async (req, res) => {
  try{
    const { expoPushToken } = req.body;
    const user = await Usermongo.findById(req.user.id);
    user.NotificationToken = expoPushToken;
    await user.save();

    res.json({ message: "Success" });
  }catch(error){
    console.log(error);
  }
});

router.get("/Gym-Location", isloggedin, async (req, res) => {
  try {
    const user = await Usermongo.findById(req.user.id);
    const LocationData = user.Location;

    if (LocationData && 
        LocationData.latitude !== undefined && 
        LocationData.longitude !== undefined &&
        LocationData.latitude !== null && 
        LocationData.longitude !== null) {
      console.log("Returning valid location data");
      res.json({
        latitude: LocationData.latitude,
        longitude: LocationData.longitude,
        timestamp: LocationData.timestamp
      });
    } else {
      console.log("Returning null - no valid location data");
      res.json(null);
    }
  } catch (error) {
    console.error("Error fetching gym location:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/check-daily-checkin", isloggedin, async (req, res) => {
  try {
    const user = await Usermongo.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    const currentTrack = user.Streak.CurrentTrack;
    let alreadyCheckedIn = false;
    let lastCheckinDate = null;

    if (currentTrack) {
      const now = new Date();

      const lastCheckinIST = new Date(new Date(currentTrack).getTime());
      

      const isSameDay =
        now.getUTCFullYear() === lastCheckinIST.getUTCFullYear() &&
        now.getUTCMonth() === lastCheckinIST.getUTCMonth() &&
        now.getUTCDate() === lastCheckinIST.getUTCDate();

      alreadyCheckedIn = isSameDay;
      lastCheckinDate = currentTrack;
    }

    res.json({
      success: true,
      alreadyCheckedIn,
      lastCheckinDate,
      message: alreadyCheckedIn
        ? "You already checked in today ✅"
        : "You haven't checked in today"
    });

  } catch (error) {
    console.error("check-daily-checkin error:", error);
    res.status(500).json({
      success: false,
      message: "Error checking daily checkin status"
    });
  }
});

router.post("/save-gym-location", isloggedin, async (req, res) => {
  try {

    const { latitude, longitude, timestamp } = req.body;

    if (latitude === undefined || longitude === undefined) {
      console.log('Missing coordinates - latitude:', latitude, 'longitude:', longitude);
      return res.status(400).json({ 
        success: false, 
        message: "Latitude and longitude are required",
        received: req.body
      });
    }

    const user = await Usermongo.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: "User not found" 
      });
    }

    user.Location = {
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude)
    };

    console.log('Saving user location:', user.Location);

    const validationError = user.validateSync();
    if (validationError) {
      console.log('Validation error:', validationError);
      return res.status(400).json({ 
        success: false, 
        message: "Validation failed",
        errors: validationError.errors 
      });
    }

    await user.save();
    
    console.log('Location saved successfully');
    res.json({ 
      success: true, 
      message: "Gym location saved successfully",
      location: user.Location 
    });
    
  } catch (error) {
    console.error('Save location error:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => ({
        field: err.path,
        message: err.message
      }));
      return res.status(400).json({ 
        success: false, 
        message: "Validation error", 
        errors 
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: "Error saving location", 
      error: error.message 
    });
  }
});

router.post("/verify-gym-location", isloggedin, async (req, res) => {
  try {
    const { verified, timestamp } = req.body;

    if (!verified) {
      return res.json({ success: false, message: "Location not verified ❌" });
    }

    const user = await Usermongo.findById(req.user.id).populate("ActiveChallenge.challengeId")
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const now = new Date(timestamp || Date.now());
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const currentTrack = user.Streak.CurrentTrack;
    if (currentTrack) {
      const last = new Date(currentTrack);
      const isSameDay =
        last.getDate() === today.getDate() &&
        last.getMonth() === today.getMonth() &&
        last.getFullYear() === today.getFullYear();

      if (isSameDay) {
        return res.status(400).json({ success: false, message: "You already checked in today ❌" });
      }
    }

    user.Streak.Track = (user.Streak.Track || 0) + 1;
    user.Streak.lastScan = user.Streak.CurrentTrack || null;
    user.Streak.CurrentTrack = now;

    const alreadyLogged = user.WorkoutLog.some(log => {
      const logDate = new Date(timestamp);
      return (
        logDate.getDate() === today.getDate() &&
        logDate.getMonth() === today.getMonth() &&
        logDate.getFullYear() === today.getFullYear()
      );
    });

    if (!alreadyLogged) {
      user.WorkoutLog.push({ date: now, scanned: true });
    }

    // rewards
    user.FitCoins += 5;
    user.Points += 10;
    const badgeData = await UserBadge(user.id);

    user.ActiveChallenge.forEach(ac => {
      if (ac.challengeId && ac.challengeId.Challenge_Type === "Non-Proof") {
        ac.ChallengeScan = (ac.ChallengeScan || 0) + 1;
      }
    });

    await user.save();

    res.json({ success: true, message: "Streak maintained, progress updated, and workout logged 🎉" });

  } catch (error) {
    console.error("verify-gym-location error:", error);
    res.status(500).json({ success: false, message: "Error verifying location" });
  }
});


module.exports = router;