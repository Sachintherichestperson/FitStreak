const mongoose = require("mongoose");

const exerciseSchema = new mongoose.Schema({
  name: { type: String, required: true },
  sets: { type: Number, default: 3 },
  reps: { type: Number, default: 10 },
  weight: Number,
  notes: String
});

const dayWorkoutSchema = new mongoose.Schema({
  day: { 
    type: String, 
    enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"], 
    required: true 
  },
  title: { type: String, required: true },
  exercises: [exerciseSchema]
});

const workoutSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  days: [dayWorkoutSchema],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Workout", workoutSchema);
