const express = require('express');
const router = express.Router();
const cron = require('node-cron');
const usermongo = require('../models/User-mongo');

async function StreakBreak() {
  const users = await usermongo.find();
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Normalize to midnight

  for (const user of users) {
    if (!user.Streak?.lastScan || !user.Streak?.CurrentScan) continue;

    const lastScanDate = new Date(user.Streak.lastScan);
    const currentScanDate = new Date(user.Streak.CurrentScan);

    lastScanDate.setHours(0, 0, 0, 0);
    currentScanDate.setHours(0, 0, 0, 0);

    const timeDiff = currentScanDate - lastScanDate;
    const daysDiff = timeDiff / (1000 * 60 * 60 * 24);

    console.log('Before');
    if (daysDiff <= 1) continue;
    console.log('After');

    let missedNonSunday = false;
    for (let i = 1; i < daysDiff; i++) {
      const missedDate = new Date(lastScanDate);
      missedDate.setDate(missedDate.getDate() + i);

      if (missedDate.getDay() !== 0) { // 0 = Sunday
        missedNonSunday = true;
        break;
      }
    }

    if (missedNonSunday) {
      user.Streak.Scan = 0;
      user.Streak.lastScan = null;
      user.Streak.CurrentScan = null;
      await user.save();
      console.log(`✅ Reset streak for user: ${user._id}`);
    } else {
      console.log(`⏩ No reset needed for user: ${user._id} (only missed Sundays)`);
    }
  }
}

cron.schedule('0 1 * * *', async () => {
  await StreakBreak();
});

module.exports = router;
