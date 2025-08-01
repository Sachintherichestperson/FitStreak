const mongoose = require('mongoose');

const BadgeSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  emoji: { type: String, required: true },
  description: { type: String, required: true },
});

module.exports = mongoose.model('Badges', BadgeSchema);
