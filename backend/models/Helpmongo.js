const mongoose = require('mongoose');

const HelpSchema = new mongoose.Schema({
  title: String,
  description: String,
  user: String,
  mobile: Number,
  date: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Help', HelpSchema);
