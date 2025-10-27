const express = require('express');
const router = express.Router();
const cron = require('node-cron');
const Usermongo = require('../models/User-mongo');
const { sendNotification } = require("./Notification");

async function StreakBreakLocation() {
  const users = await Usermongo.find();

  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  const todayIST = new Date(now.getTime() + istOffset);
  todayIST.setUTCHours(0, 0, 0, 0);

  for (const user of users) {
    if (!user.Streak?.CurrentTrack) continue;

    
    const lastScanDate = new Date(user.Streak.CurrentTrack);
    const lastScanIST = new Date(lastScanDate.getTime() + istOffset);
    lastScanIST.setUTCHours(0, 0, 0, 0);

    const daysDiff = (todayIST - lastScanIST) / (1000 * 60 * 60 * 24);

    if (daysDiff === 0) continue;
    if (daysDiff === 1) continue;

    let missedNonSunday = false;
    for (let i = 1; i < daysDiff; i++) {
      const missedDate = new Date(lastScanIST);
      missedDate.setDate(missedDate.getDate() + i);
      if (missedDate.getDay() !== 0) {
        missedNonSunday = true;
        break;
      }
    }
    console.log(user.Streak.Track)

    if (missedNonSunday) {
      user.Streak.Track = 0;
      user.Streak.CurrentTrack = null;
      user.Streak.lastScan = null;
      user.StreakLost = (user.StreakLost || 0) + 1;
      user.DaysMissed = (user.DaysMissed || 0) + 1;
      user.FitCoins = Math.max(0, (user.FitCoins || 0) - 7);
      user.Points = Math.max(0, (user.Points || 0) - 10);
      await sendNotification(
        user.NotificationToken,
        "OOPS! You Became Loser",
        "You Broke Your Streak, You are currently in 90% of the average People."
      );
      await user.save();
    }
  }
}


cron.schedule('45 1 * * *', async () => {
  await StreakBreakLocation();
}, {
  timezone: "Asia/Kolkata"
});

module.exports = router;
