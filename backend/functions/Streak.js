const express = require('express');
const router = express.Router();
const cron = require('node-cron');
const Usermongo = require('../models/User-mongo');
const sendNotification = require("./Notification");

async function StreakBreakLocation() {
  const users = await Usermongo.find();

  // Get today's date at IST midnight
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000; // 5h30m in ms
  const todayIST = new Date(now.getTime() + istOffset);
  todayIST.setUTCHours(0, 0, 0, 0); // normalize to IST midnight
  console.log("Hello");

  for (const user of users) {
    if (!user.Streak?.CurrentTrack) continue;

    // Convert last scan to IST midnight
    const lastScanDate = new Date(user.Streak.CurrentTrack);
    const lastScanIST = new Date(lastScanDate.getTime() + istOffset);
    lastScanIST.setUTCHours(0, 0, 0, 0);

    // Difference in IST days
    const daysDiff = (todayIST - lastScanIST) / (1000 * 60 * 60 * 24);
    console.log(daysDiff);

    if (daysDiff === 0) continue; // same day
    if (daysDiff === 1) continue; // yesterday, still safe

    let missedNonSunday = false;
    for (let i = 1; i < daysDiff; i++) {
      const missedDate = new Date(lastScanIST);
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
      user.FitCoins -= 7;
      user.Points -= 10;
      await sendNotification(
        user.NotificationToken,
        "OOPS! You Became Loser",
        "You Broke Your Streak, You are currently in 90% of the average People."
      );
      await user.save();
    }
  }
}


cron.schedule('42 2 * * *', async () => {
  await StreakBreakLocation();
}, {
  timezone: "Asia/Kolkata"
});


module.exports = router;