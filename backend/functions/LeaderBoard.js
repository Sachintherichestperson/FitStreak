const usermongo = require('../models/User-mongo');
const express = require('express');
const router = express.Router();
const isloggedin = require('../middleware/isloggein');
const Postmongo = require('../models/post-mongo');
const Gymmongo = require("../models/Gymmongo");

async function LeaderBoard() {
  try {
    // Get top 10 users sorted by Points and Streak
    const topUsers = await usermongo.find()
      .sort({ Points: -1, 'Streak.Scan': -1 })
      .limit(10)
      .populate('CurrentBadge', 'emoji name'); // Populate badge info

    // Format the leaderboard data
    const leaderboard = topUsers.map((user, index) => ({
      rank: index + 1,
      name: user.username,
      streak: user.Streak?.Scan || 0,
      points: user.Points || 0,
      badge: user.CurrentBadge?.name || 'Newbie',
      emoji: user.CurrentBadge?.emoji || '🌟'
    }));

    return leaderboard;
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    throw error;
  }
}

module.exports = router;
