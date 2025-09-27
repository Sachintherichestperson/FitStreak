const mongoose = require("mongoose");

const foodItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  portion: { type: String, required: true },
  calories: { type: Number, required: true },
  protein: { type: Number, required: true },
  carbs: { type: Number, required: true },
  fat: { type: Number, required: true }
});

const mealSchema = new mongoose.Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  time: { type: String, required: true },
  isCustom: { type: Boolean, default: false },
  enabled: { type: Boolean, default: true },
  foods: [foodItemSchema],
  totalCalories: { type: Number, default: 0 },
  totalProtein: { type: Number, default: 0 },
  totalCarbs: { type: Number, default: 0 },
  totalFat: { type: Number, default: 0 }
});

const daySchema = new mongoose.Schema({
  day: { type: String, required: true },
  enabled: { type: Boolean, default: true },
  meals: [mealSchema],
  totalCalories: { type: Number, default: 0 }
});

const dietPlanSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  kcalGoal: { type: Number, required: true },
  isSameForAllDays: { type: Boolean, default: false },
  days: {
    monday: daySchema,
    tuesday: daySchema,
    wednesday: daySchema,
    thursday: daySchema,
    friday: daySchema,
    saturday: daySchema,
    sunday: daySchema
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Update the updatedAt field before saving
dietPlanSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model("Diet", dietPlanSchema);