const express = require('express');
const router = express.Router();
const cron = require('node-cron');
const Usermongo = require('../models/User-mongo');
const sendNotification = require("./Notification");

async function StreakBreakLocation() {
  const users = await Usermongo.find();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (const user of users) {
    if (!user.Streak?.CurrentTrack) continue;

    const lastScanDate = new Date(user.Streak.CurrentTrack);
    lastScanDate.setHours(0, 0, 0, 0);

    const daysDiff = (today - lastScanDate) / (1000 * 60 * 60 * 24);

    if (daysDiff === 1) continue;

    if (daysDiff === 0) continue;

    let missedNonSunday = false;
    for (let i = 1; i < daysDiff; i++) {
      const missedDate = new Date(lastScanDate);
      missedDate.setDate(missedDate.getDate() + i);
      if (missedDate.getDay() !== 0) {
        missedNonSunday = true;
        break;
      }
    }

    if (missedNonSunday) {
      user.Streak.Track = 0;
      user.Streak.CurrentTrack = null;
      user.Streak.lastScan = null;
      user.StreakLost = (user.StreakLost || 0) + 1;
      user.DaysMissed = (user.DaysMissed || 0) + 1;
      user.FitCoins -= 7
      user.Points -= 10
      await sendNotification(user.NotificationToken, "OOPS! You Became Loser", "You Broke Your Streak, You are currently in 90% of the average People.");
      await user.save();
    }
  }
}

cron.schedule('0 1 * * *', async () => {
  await StreakBreakLocation();
});

module.exports = router;