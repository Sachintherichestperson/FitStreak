const mongoose = require("mongoose");

mongoose.connect("mongodb://localhost:27017/The_FitStreak");

module.exports = mongoose;