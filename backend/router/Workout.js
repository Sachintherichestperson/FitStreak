const express = require('express');
const router = express.Router();
const Usermongo = require('../models/User-mongo');
const Workoutmongo = require('../models/Workoutmongo');
const isloggedin = require('../middleware/isloggein');

router.get('/', isloggedin, async (req, res) => {
    try {
        const workouts = await Workoutmongo.find({ user: req.user._id });

        res.json(workouts);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.get('/Add/workouts', isloggedin, async (req, res) => {
    try {
        const workouts = await Workoutmongo.find({ user: req.user._id });
        console.log(workouts);

        res.json(workouts);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.post("/Add/workouts", isloggedin, async (req, res) => {
  const { day, title, name, sets, reps, weight, notes } = req.body.newExercise;

  if (!day || !title || !name || !sets) {
    return res.status(400).json({ error: "Day, title, exercise name, and sets are required" });
  }

  try {
    const formattedDay = day.charAt(0).toUpperCase() + day.slice(1).toLowerCase();
    const userId = req.user.id;

    let workout = await Workoutmongo.findOne({ user: userId });
    const User = await Usermongo.findById(userId);

    const newExercise = { name, sets, reps, weight, notes };

    if (!workout) {
      workout = new Workoutmongo({
        user: userId,
        days: [{ day: formattedDay, title, exercises: [newExercise] }]
      });
    } else {
      let dayObj = workout.days.find(d => d.day === formattedDay);

      if (!dayObj) {
        workout.days.push({ day: formattedDay, title, exercises: [newExercise] });
      } else {
        dayObj.title = title;
        dayObj.exercises.push(newExercise);
      }
    }

    User.workouts.push(workout);
    await workout.save();
    await User.save();
    res.status(201).json({ message: "Exercise added successfully", workout });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to add exercise" });
  }
});

router.delete("/Add/workouts/:workoutId/exercise/:exerciseName", isloggedin, async (req, res) => {
  try {
    const { workoutId, exerciseName } = req.params;
    const userId = req.user.id;

    const workout = await Workoutmongo.findOne({ _id: workoutId, user: userId });
    if (!workout) {
      return res.status(404).json({ error: "Workout not found or unauthorized" });
    }

    let exerciseRemoved = false;

    // Iterate through all days to find and remove the exercise by name
    for (const day of workout.days) {
      const before = day.exercises.length;
      day.exercises = day.exercises.filter(ex => ex.name !== exerciseName);
      if (day.exercises.length < before) {
        exerciseRemoved = true;
      }
    }

    if (!exerciseRemoved) {
      return res.status(404).json({ error: "Exercise not found" });
    }

    await workout.save();
    res.status(200).json({ message: "Exercise deleted successfully", workout });
  } catch (error) {
    console.error("Error deleting exercise:", error);
    res.status(500).json({ error: "Failed to delete exercise" });
  }
});


module.exports = router;